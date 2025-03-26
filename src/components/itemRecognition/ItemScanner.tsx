'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import Toast from '@/components/ui/Toast'

interface DetectedItem {
  id: string
  name: string
  confidence: number
  bbox: [number, number, number, number]
  imageData?: string
}

interface FeedbackModalProps {
  item: DetectedItem
  onFeedback: (isCorrect: boolean, correctName?: string) => void
  onClose: () => void
}

function FeedbackModal({ item, onFeedback, onClose }: FeedbackModalProps) {
  const [correctName, setCorrectName] = useState('')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">Is this detection correct?</h3>
        <p className="mb-4">Detected: {item.name} ({Math.round(item.confidence * 100)}%)</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              If incorrect, what is the correct item?
            </label>
            <input
              type="text"
              value={correctName}
              onChange={(e) => setCorrectName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter correct item name"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => onFeedback(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Yes, Correct
            </button>
            <button
              onClick={() => onFeedback(false, correctName)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              No, Incorrect
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function ItemScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [feedbackItem, setFeedbackItem] = useState<DetectedItem | null>(null)
  const [confirmedItems, setConfirmedItems] = useState<DetectedItem[]>([])
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const { data: session } = useSession()

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }

  useEffect(() => {
    // Load the COCO-SSD model
    const loadModel = async () => {
      try {
        await tf.ready()
        const loadedModel = await cocoSsd.load()
        setModel(loadedModel)
      } catch (error) {
        console.error('Error loading model:', error)
      }
    }
    loadModel()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsScanning(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const getImageData = (canvas: HTMLCanvasElement): string => {
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const detectItems = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for training
    const imageData = getImageData(canvas)

    // Run detection
    const predictions = await model.detect(canvas)
    
    // Process predictions
    const items: DetectedItem[] = predictions.map(pred => ({
      id: Math.random().toString(36).substr(2, 9),
      name: pred.class,
      confidence: pred.score,
      bbox: pred.bbox as [number, number, number, number],
      imageData
    }))

    // Clear previous detections
    setDetectedItems([])
    setConfirmedItems([])

    // Show feedback modal for each detected item
    if (items.length > 0) {
      setDetectedItems(items)
      setFeedbackItem(items[0])
    }

    // Draw bounding boxes
    context.strokeStyle = '#00ff00'
    context.lineWidth = 2
    items.forEach(item => {
      const [x, y, width, height] = item.bbox
      context.strokeRect(x, y, width, height)
      context.fillStyle = '#00ff00'
      context.font = '16px Arial'
      context.fillText(`${item.name} (${Math.round(item.confidence * 100)}%)`, x, y - 5)
    })
  }

  const saveItem = async (item: DetectedItem) => {
    if (!session?.user) {
      console.error('No user session found')
      showToast('You must be logged in to save items.', 'error')
      return
    }

    try {
      console.log('Starting to save item:', {
        name: item.name,
        confidence: item.confidence,
        imageDataLength: item.imageData ? item.imageData.length : 0,
        sessionUser: session.user
      })

      // Check if imageData is valid
      if (!item.imageData || item.imageData.length < 100) {
        console.error('Invalid or missing image data')
        showToast('Missing image data. Please try capturing the item again.', 'error')
        return
      }

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          confidence: item.confidence,
          imageData: item.imageData,
          userId: session.user.id
        }),
      })

      const responseText = await response.text()
      console.log('Raw response:', responseText)

      if (!response.ok) {
        let error
        try {
          error = JSON.parse(responseText)
        } catch (e) {
          error = { error: responseText }
        }
        throw new Error(error.error || 'Failed to save item')
      }

      const savedItem = JSON.parse(responseText)
      console.log('Item saved successfully:', savedItem)

      // Remove the saved item from the list
      setDetectedItems(prev => prev.filter(i => i.id !== item.id))
      setConfirmedItems(prev => prev.filter(i => i.id !== item.id))
      
      showToast('Item saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving item:', error)
      showToast('Failed to save item. Please try again.', 'error')
    }
  }

  const handleFeedback = async (isCorrect: boolean, correctName?: string) => {
    if (!feedbackItem) return
    
    if (!session?.user) {
      console.error('No user session found')
      showToast('You must be logged in to provide feedback.', 'error')
      return
    }
  
    try {
      // Create the confirmed item
      const confirmedItem = isCorrect 
        ? { ...feedbackItem, confidence: 1.0 }
        : correctName 
          ? { ...feedbackItem, name: correctName, confidence: 1.0 }
          : null
  
      // Save feedback and training data
      const feedbackResponse = await fetch('/api/items/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: feedbackItem.id,
          isCorrect,
          correctName,
          imageData: feedbackItem.imageData,
          detectedName: feedbackItem.name,
          confidence: feedbackItem.confidence,
          userId: session.user.id,
        }),
      })
  
      if (!feedbackResponse.ok) {
        const errorText = await feedbackResponse.text()
        console.error('Feedback error:', feedbackResponse.status, errorText)
        throw new Error(`Failed to save feedback: ${feedbackResponse.status}`)
      }
  
      // Save training data when user corrects or confirms an item
      if (isCorrect || correctName) {
        const trainingResponse = await fetch('/api/training', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemName: isCorrect ? feedbackItem.name : correctName,
            imageData: feedbackItem.imageData,
            bbox: feedbackItem.bbox,
            confidence: feedbackItem.confidence,
            detectedAs: feedbackItem.name,
            userId: session.user.id,
          }),
        })
  
        if (!trainingResponse.ok) {
          const errorText = await trainingResponse.text()
          console.error('Training error:', trainingResponse.status, errorText)
          console.error('Failed to save training data')
        }
      }
  
      // Add to confirmed items if valid
      if (confirmedItem) {
        setConfirmedItems(prev => [...prev, confirmedItem])
        
        // Automatically save the item to the database
        if (isCorrect || correctName) {
          await saveItem(confirmedItem)
          console.log('Item automatically saved to database')
        }
      }
  
      // Update the detected items list and show next item for feedback
      setDetectedItems(prev => {
        const remainingItems = prev.filter(i => i.id !== feedbackItem.id)
        if (remainingItems.length > 0) {
          setFeedbackItem(remainingItems[0])
        } else {
          setFeedbackItem(null)
        }
        return remainingItems
      })
    } catch (error) {
      console.error('Error handling feedback:', error)
      showToast('Error saving item. Please try again.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={isScanning ? stopCamera : startCamera}
          className={`px-4 py-2 rounded-lg ${
            isScanning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>
        {isScanning && (
          <button
            onClick={detectItems}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            Detect Items
          </button>
        )}
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full max-w-2xl mx-auto rounded-lg shadow-lg"
        />
      </div>

      {confirmedItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Confirmed Items:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {confirmedItems.map(item => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    Confidence: {Math.round(item.confidence * 100)}%
                  </p>
                </div>
                <button
                  onClick={() => saveItem(item)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedbackItem && (
        <FeedbackModal
          item={feedbackItem}
          onFeedback={handleFeedback}
          onClose={() => setFeedbackItem(null)}
        />
      )}
    </div>
  )
} 




