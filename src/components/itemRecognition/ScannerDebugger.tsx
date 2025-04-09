'use client'

import { useState, useRef, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'

interface DebugInfo {
  modelStatus: string
  cameraStatus: string
  tensorStatus: string
  predictionStatus: string
  errors: string[]
  lastFrame: string | null
  lastPrediction: any
}

export default function ScannerDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    modelStatus: 'Not initialized',
    cameraStatus: 'Not initialized',
    tensorStatus: 'Not initialized',
    predictionStatus: 'Not initialized',
    errors: [],
    lastFrame: null,
    lastPrediction: null
  })
  const [model, setModel] = useState<tf.LayersModel | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        setDebugInfo(prev => ({ ...prev, modelStatus: 'Loading...' }))
        await tf.ready()
        console.log('TensorFlow initialized')
        
        const loadedModel = await tf.loadLayersModel(
          'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
        )
        console.log('Model loaded successfully')
        
        // Test the model
        const testTensor = tf.zeros([1, 224, 224, 3])
        const testPrediction = await loadedModel.predict(testTensor) as tf.Tensor
        console.log('Model test successful:', testPrediction.shape)
        testTensor.dispose()
        testPrediction.dispose()
        
        setModel(loadedModel)
        setDebugInfo(prev => ({ ...prev, modelStatus: 'Loaded successfully' }))
      } catch (error) {
        console.error('Error loading model:', error)
        setDebugInfo(prev => ({
          ...prev,
          modelStatus: 'Failed to load',
          errors: [...prev.errors, `Model error: ${error}`]
        }))
      }
    }

    loadModel()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, cameraStatus: 'Starting...' }))
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'environment'
        } 
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            resolve(true)
          }
        }
      })

      setDebugInfo(prev => ({ ...prev, cameraStatus: 'Running' }))
      startDetectionLoop()
    } catch (error) {
      console.error('Error starting camera:', error)
      setDebugInfo(prev => ({
        ...prev,
        cameraStatus: 'Failed to start',
        errors: [...prev.errors, `Camera error: ${error}`]
      }))
    }
  }

  const startDetectionLoop = async () => {
    if (!model || !videoRef.current || !canvasRef.current) {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, 'Required components not available']
      }))
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to get canvas context']
      }))
      return
    }

    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight

    const detectLoop = async () => {
      try {
        // Capture frame
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height)
        
        // Save frame for debugging
        const frameData = canvas.toDataURL('image/jpeg', 0.8)
        setDebugInfo(prev => ({ ...prev, lastFrame: frameData }))

        // Convert to tensor
        setDebugInfo(prev => ({ ...prev, tensorStatus: 'Converting...' }))
        const tensor = tf.browser.fromPixels(canvas)
        const resized = tf.image.resizeBilinear(tensor, [224, 224])
        const expanded = resized.expandDims(0)
        const normalized = expanded.toFloat().div(255.0)
        setDebugInfo(prev => ({ ...prev, tensorStatus: 'Ready' }))

        // Get predictions
        setDebugInfo(prev => ({ ...prev, predictionStatus: 'Running...' }))
        const predictions = await model.predict(normalized) as tf.Tensor
        const probabilities = await predictions.data()
        
        // Get top 3 predictions
        const top3 = Array.from(probabilities)
          .map((prob, index) => ({ probability: prob, index }))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 3)

        setDebugInfo(prev => ({
          ...prev,
          predictionStatus: 'Complete',
          lastPrediction: top3
        }))

        // Clean up
        tensor.dispose()
        resized.dispose()
        expanded.dispose()
        normalized.dispose()
        predictions.dispose()

        // Continue loop
        requestAnimationFrame(detectLoop)
      } catch (error) {
        console.error('Error in detection loop:', error)
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, `Detection error: ${error}`]
        }))
        // Try to continue the loop
        setTimeout(() => {
          requestAnimationFrame(detectLoop)
        }, 1000)
      }
    }

    detectLoop()
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Scanner Debugger</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Model Status:</h3>
            <p className={debugInfo.modelStatus === 'Loaded successfully' ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.modelStatus}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold">Camera Status:</h3>
            <p className={debugInfo.cameraStatus === 'Running' ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.cameraStatus}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold">Tensor Status:</h3>
            <p className={debugInfo.tensorStatus === 'Ready' ? 'text-green-600' : 'text-yellow-600'}>
              {debugInfo.tensorStatus}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold">Prediction Status:</h3>
            <p className={debugInfo.predictionStatus === 'Complete' ? 'text-green-600' : 'text-yellow-600'}>
              {debugInfo.predictionStatus}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Last Predictions:</h3>
            {debugInfo.lastPrediction && (
              <ul className="list-disc pl-4">
                {debugInfo.lastPrediction.map((pred: any, index: number) => (
                  <li key={index}>
                    Item {pred.index + 1}: {(pred.probability * 100).toFixed(2)}%
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Errors:</h3>
            {debugInfo.errors.length > 0 ? (
              <ul className="list-disc pl-4 text-red-600">
                {debugInfo.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600">No errors</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>

        {debugInfo.lastFrame && (
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={debugInfo.lastFrame}
              alt="Last captured frame"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Camera
        </button>
      </div>
    </div>
  )
} 