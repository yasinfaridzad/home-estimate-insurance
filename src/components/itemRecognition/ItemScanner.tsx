'use client'

import { useRef, useState, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

export default function ItemScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([])

  // Initialize TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready()
        const loadedModel = await cocoSsd.load()
        setModel(loadedModel)
        setError('')
      } catch (err) {
        setError('Failed to load object detection model')
        console.error('Error loading model:', err)
      }
    }
    loadModel()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        setError('')
        startDetection()
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure you have granted camera permissions.')
      console.error('Error accessing camera:', err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsScanning(false)
      setDetectedObjects([])
    }
  }

  const startDetection = () => {
    if (!model || !videoRef.current || !canvasRef.current) return

    const detectFrame = async () => {
      if (!isScanning) return
      if (videoRef.current && model) {
        try {
          const predictions = await model.detect(videoRef.current)
          setDetectedObjects(predictions)
          drawDetections(predictions)
          requestAnimationFrame(detectFrame)
        } catch (err) {
          console.error('Detection error:', err)
        }
      }
    }
    detectFrame()
  }

  const drawDetections = (predictions: cocoSsd.DetectedObject[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Draw detections
    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox

      // Draw bounding box
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)

      // Draw label
      ctx.fillStyle = '#00ff00'
      ctx.font = '16px Arial'
      ctx.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        x,
        y > 20 ? y - 5 : y + 20
      )
    })
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="relative">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {!isScanning && (
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Scanning
            </button>
          )}
        </div>
      </div>
      {isScanning && (
        <div className="mt-4 space-y-4">
          <button
            onClick={stopCamera}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors w-full"
          >
            Stop Scanning
          </button>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Detected Items:</h3>
            {detectedObjects.length > 0 ? (
              <ul className="space-y-1">
                {detectedObjects.map((obj, index) => (
                  <li key={index} className="text-sm">
                    {obj.class} - {Math.round(obj.score * 100)}% confidence
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No items detected yet...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 