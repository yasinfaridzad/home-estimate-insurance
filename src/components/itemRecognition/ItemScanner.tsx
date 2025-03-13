'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

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

export default function ItemScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [feedbackItem, setFeedbackItem] = useState<DetectedItem | null>(null)
  const { data: session } = useSession()

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

    setDetectedItems(items)

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

    // Show feedback modal for each detected item
    items.forEach(item => {
      if (item.confidence < 0.8) { // Only ask for feedback on low confidence detections
        setFeedbackItem(item)
      }
    })
  }

  const saveItem = async (item: DetectedItem) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          confidence: item.confidence,
          imageData: item.imageData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save item')
      }

      // Remove the saved item from the list
      setDetectedItems(prev => prev.filter(i => i.id !== item.id))
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  const handleFeedback = async (isCorrect: boolean, correctName?: string) => {
    if (!feedbackItem) return

    try {
      // First save the feedback
      const response = await fetch('/api/items/feedback', {
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

      if (!response.ok) {
        throw new Error('Failed to save feedback')
      }

      // If the detection was incorrect and we have a correct name, save the corrected item
      if (!isCorrect && correctName) {
        const saveResponse = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: correctName,
            confidence: 1.0, // Set high confidence for user-corrected items
            imageData: feedbackItem.imageData,
          }),
        })

        if (!saveResponse.ok) {
          throw new Error('Failed to save corrected item')
        }
      }

      // Update the detected items list
      setDetectedItems(prev => {
        if (isCorrect) {
          // If correct, keep the item but update its confidence
          return prev.map(i => 
            i.id === feedbackItem.id 
              ? { ...i, confidence: 1.0 }
              : i
          )
        } else if (correctName) {
          // If incorrect with correction, replace the item with the corrected one
          return prev.map(i => 
            i.id === feedbackItem.id 
              ? { ...i, name: correctName, confidence: 1.0 }
              : i
          )
        } else {
          // If incorrect without correction, remove the item
          return prev.filter(i => i.id !== feedbackItem.id)
        }
      })
    } catch (error) {
      console.error('Error saving feedback:', error)
    } finally {
      setFeedbackItem(null)
    }
  }

  return (
    <div className="space-y-4">
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

      {detectedItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Detected Items:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectedItems.map(item => (
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