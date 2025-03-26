'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

interface DetectedItem {
  id: string
  name: string
  confidence: number
  bbox: [number, number, number, number]
  imageData?: string
}

interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'info'
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

export default function ItemScanner() {
  const { data: session } = useSession()
  const [isScanning, setIsScanning] = useState(false)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [feedbackItem, setFeedbackItem] = useState<DetectedItem | null>(null)
  const [confirmedItems, setConfirmedItems] = useState<DetectedItem[]>([])
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Load the model when component mounts
    const loadModel = async () => {
      try {
        await tf.ready()
        const loadedModel = await cocoSsd.load()
        setModel(loadedModel)
      } catch (error) {
        console.error('Error loading model:', error)
        setToast({
          message: 'Failed to load detection model',
          type: 'error'
        })
      }
    }

    loadModel()

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startScanning = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return

    try {
      // Set up video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      })
      
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve(true)
        }
      })

      setIsScanning(true)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      // Start detection loop
      const detectLoop = () => {
        if (!isScanning) return

        // Draw video frame to canvas
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        // Run detection
        model.detect(canvas).then(predictions => {
          // Process predictions with confidence threshold
          const items = predictions
            .filter(pred => pred.score > 0.5) // Only keep high confidence detections
            .map(pred => ({
              id: Math.random().toString(36).substr(2, 9),
              name: pred.class,
              confidence: pred.score,
              bbox: pred.bbox as [number, number, number, number],
              imageData: canvas.toDataURL('image/jpeg', 0.8)
            }))

          setDetectedItems(items)
          
          // Set current item if none is selected
          if (items.length > 0 && !feedbackItem) {
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

          // Continue detection loop
          requestAnimationFrame(detectLoop)
        }).catch(error => {
          console.error('Error in detection loop:', error)
          setToast({
            message: 'Error during detection',
            type: 'error'
          })
        })
      }

      detectLoop()
    } catch (error) {
      console.error('Error starting camera:', error)
      setToast({
        message: 'Failed to start camera',
        type: 'error'
      })
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleFeedback = async (isCorrect: boolean, correctName?: string) => {
    if (!feedbackItem || !session?.user) {
      setToast({
        message: 'Please log in to provide feedback',
        type: 'error'
      })
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
        }),
      })

      if (!feedbackResponse.ok) {
        throw new Error('Failed to save feedback')
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
          }),
        })

        if (!trainingResponse.ok) {
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

      setToast({
        message: isCorrect ? 'Item saved successfully' : 'Feedback recorded for improvement',
        type: 'success'
      })
    } catch (error) {
      console.error('Error saving feedback:', error)
      setToast({
        message: 'Failed to save feedback',
        type: 'error'
      })
    }
  }

  const saveItem = async (item: DetectedItem) => {
    if (!session?.user) {
      console.error('No user session found')
      setToast({
        message: 'You must be logged in to save items.',
        type: 'error'
      })
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
        setToast({
          message: 'Missing image data. Please try capturing the item again.',
          type: 'error'
        })
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
      
      setToast({
        message: 'Item saved successfully!',
        type: 'success'
      })
    } catch (error) {
      console.error('Error saving item:', error)
      setToast({
        message: 'Failed to save item. Please try again.',
        type: 'error'
      })
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-gray-600">Please sign in to use the scanner</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Item Scanner</h2>
        <Button
          onClick={isScanning ? stopScanning : startScanning}
          variant={isScanning ? 'destructive' : 'default'}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
          />
        </div>

        <div className="space-y-4">
          {confirmedItems.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Confirmed Items:</h3>
              <div className="space-y-2">
                {confirmedItems.map(item => (
                  <p key={item.id}>
                    <span className="font-medium">Name:</span> {item.name}
                  </p>
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
      </div>
    </div>
  )
} 




