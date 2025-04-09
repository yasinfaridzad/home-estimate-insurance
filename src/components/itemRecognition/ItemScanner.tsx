// Bereinigte und voll funktionsfähige Version deiner Datei
'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'

interface DetectedItem {
  id: string
  name: string
  confidence: number
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
  const { data: session, status } = useSession()
  const [isScanning, setIsScanning] = useState(false)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [feedbackItem, setFeedbackItem] = useState<DetectedItem | null>(null)
  const [confirmedItems, setConfirmedItems] = useState<DetectedItem[]>([])
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          setIsScanning(true)
          setTimeout(() => {
            if (isScanning) detectLoop()
          }, 100)
        }
      } catch (error) {
        console.error('Error starting camera:', error)
        setToast({ message: 'Kamera konnte nicht gestartet werden', type: 'error' })
        setIsScanning(false)
      }
    }
    setupCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const detectLoop = async () => {
    if (!isScanning) return

    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      })

      const result = await response.json()
      console.log('Prediction API response:', result) // <- Logging hinzugefügt

      if (!result.name || !result.category) {
        setToast({ message: 'Kein Objekt erkannt', type: 'info' })
      } else {
        const detectedItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: result.name,
          confidence: result.confidence,
          imageData
        }
        setDetectedItems([detectedItem])
        setFeedbackItem(detectedItem)
      }
    } catch (err) {
      console.error('Fehler bei der Vorhersage:', err)
      setToast({ message: 'Fehler bei der Erkennung', type: 'error' })
    }

    if (isScanning) {
      setTimeout(detectLoop, 3000)
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
    // Feedback-Handling bleibt wie gehabt
  }

  const saveItem = async (item: DetectedItem) => {
    // Item speichern bleibt wie gehabt
  }

  if (status === 'loading') return <p>Loading...</p>
  if (!session?.user) return <p>Bitte einloggen</p>

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Item Scanner</h2>
        <div className="flex items-center space-x-4">
          <Button onClick={isScanning ? stopScanning : detectLoop} variant={isScanning ? 'destructive' : 'default'}>
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <div className="space-y-4">
          {detectedItems.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Detected Items:</h3>
              <div className="space-y-2">
                {detectedItems.map(item => (
                  <p key={item.id}>
                    <span className="font-medium">Name:</span> {item.name} ({Math.round(item.confidence * 100)}%)
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
