'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs'

interface DetectedItem {
  name: string
  confidence: number
}

export default function ItemScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [items, setItems] = useState<DetectedItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  

 // Wichtig: Vor dem Modell-Load WebGL aktivieren!
 useEffect(() => {
  tf.setBackend('webgl') // oder 'cpu' falls WebGL bei dir nicht geht
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
      interval = setInterval(detectFrame, 2000)
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
      const topPredictions = predictions.map(p => ({
        name: p.class,
        confidence: p.score
      }))
      setItems(topPredictions)
      setToast({ message: `${topPredictions.length} Objekte erkannt`, type: 'success' })
    } else {
      setItems([])
      setToast({ message: 'Keine Objekte erkannt', type: 'info' })
    }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Item Scanner (Browser)</h2>
        <Button onClick={() => setIsScanning(prev => !prev)} variant={isScanning ? 'destructive' : 'default'}>
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <div className="space-y-4">
          {items.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Erkannte Objekte:</h3>
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{item.name}</span> – {Math.round(item.confidence * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}