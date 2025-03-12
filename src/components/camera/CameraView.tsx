'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const ItemDetails = dynamic(() => import('@/components/itemRecognition/ItemDetails'), {
  ssr: false
})

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string>('')
  const [capturedImage, setCapturedImage] = useState<string>('')

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsStreaming(true)
        }
      } catch (err) {
        setError('Unable to access camera. Please ensure you have granted camera permissions.')
        console.error('Camera access error:', err)
      }
    }

    setupCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const captureImage = () => {
    if (!videoRef.current || !isStreaming) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(videoRef.current, 0, 0)
      setCapturedImage(canvas.toDataURL('image/jpeg'))
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video bg-gray-900 rounded-lg"
              />
              <button
                onClick={captureImage}
                disabled={!isStreaming}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
              >
                Capture Item
              </button>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured item"
                className="w-full aspect-video bg-gray-900 rounded-lg object-contain"
              />
              <button
                onClick={() => setCapturedImage('')}
                className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg"
              >
                Retake Photo
              </button>
              <ItemDetails imageData={capturedImage} />
            </>
          )}
        </>
      )}
    </div>
  )
} 