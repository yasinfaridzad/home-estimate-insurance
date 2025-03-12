'use client'

import { useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export default function ItemScanner() {
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [imageData, setImageData] = useState<string>()
  const [error, setError] = useState<string>()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        setError(undefined)
      }
    } catch (err) {
      setError('Failed to access camera. Please make sure you have granted camera permissions.')
      console.error('Error accessing camera:', err)
    }
  }

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = canvas.toDataURL('image/jpeg')
        setImageData(imageData)
        stopCamera()
      }
    }
  }, [stopCamera])

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        {!isScanning && !imageData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Scanning
            </button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={captureImage}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Capture
          </button>
          <button
            onClick={stopCamera}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      )}

      {imageData && (
        <div className="mt-4">
          <img src={imageData} alt="Captured item" className="rounded-lg" />
          <button
            onClick={() => {
              setImageData(undefined)
              startCamera()
            }}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  )
} 