'use client'

import { useEffect, useRef, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

interface DetectedItem {
  name: string
  confidence: number
  bbox: [number, number, number, number]
}

export default function ItemScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready()
        const loadedModel = await cocoSsd.load()
        setModel(loadedModel)
      } catch (error) {
        console.error('Error loading model:', error)
        setError('Failed to load object detection model')
      }
    }
    loadModel()
  }, [])

  const startScanning = async () => {
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
      detectFrame()
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Could not access camera. Please make sure you have granted camera permissions.')
    }
  }

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const detectFrame = async () => {
    if (!model || !videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Detect objects
    const predictions = await model.detect(canvas)
    setDetectedItems(predictions.map(pred => ({
      name: pred.class,
      confidence: pred.score,
      bbox: pred.bbox as [number, number, number, number]
    })))

    // Draw bounding boxes
    predictions.forEach(pred => {
      const [x, y, width, height] = pred.bbox
      context.strokeStyle = '#00ff00'
      context.lineWidth = 2
      context.strokeRect(x, y, width, height)
      context.fillStyle = '#00ff00'
      context.font = '16px Arial'
      context.fillText(`${pred.class} (${Math.round(pred.score * 100)}%)`, x, y - 5)
    })

    // Continue detection loop
    requestAnimationFrame(detectFrame)
  }

  return (
    <div className="relative">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="relative w-full max-w-2xl mx-auto">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg shadow-lg"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      
      <div className="mt-4 flex justify-center space-x-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Scanning
          </button>
        )}
      </div>

      {detectedItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Detected Items:</h3>
          <ul className="space-y-2">
            {detectedItems.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{item.name}</span>
                <span className="text-gray-600">
                  {Math.round(item.confidence * 100)}% confidence
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 