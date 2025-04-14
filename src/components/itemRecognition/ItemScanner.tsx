'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs'

interface DetectedItem {
  id: string
  name: string
  confidence: number
  imageData?: string
  price?: number
}

export default function ItemScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)

  useEffect(() => {
    tf.setBackend('webgl')
    tf.ready().then(() => {
      cocoSsd.load().then(setModel)
    })
  }, [])

  useEffect(() => {
    const enableCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) videoRef.current.srcObject = stream
    }
    enableCamera()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isScanning && model) {
      interval = setInterval(detectFrame, 3000)
    }
    return () => clearInterval(interval)
  }, [isScanning, model])

  const detectFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !model) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const predictions = await model.detect(canvas)
    if (predictions.length > 0) {
      const top = predictions[0]
      const name = top.class
      const confidence = top.score
      const estimatedPrice = await fetchEstimatedPrice(name)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)

      const newItem = {
        name,
        confidence,
        estimatedValue: estimatedPrice,
        imageData,
        timestamp: new Date().toISOString()
      }

      try {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        })
        setToast({ message: `Gespeichert: ${name} (€${estimatedPrice})`, type: 'success' })
      } catch (error) {
        console.error('Fehler beim Speichern:', error)
        setToast({ message: 'Fehler beim Speichern', type: 'error' })
      }
    }
  }

  const fetchEstimatedPrice = async (name: string): Promise<number> => {
    const priceMap: Record<string, number> = {
      tv: 500,
      laptop: 800,
      chair: 100,
      couch: 300,
      toaster: 40,
      other: 120
    }
    const lower = name.toLowerCase()
    return priceMap[lower] || 100 + Math.floor(Math.random() * 200)
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Item Scanner</h2>
        <Button onClick={() => setIsScanning(prev => !prev)} variant={isScanning ? 'destructive' : 'default'}>
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />
        </div>
      </div>
    </div>
  )
}
