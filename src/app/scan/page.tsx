'use client'

import { useSession } from 'next-auth/react'
import ItemScanner from '@/components/itemRecognition/ItemScanner'

export default function ScanPage() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to scan items.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Scan Items</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-6">
          Point your camera at household items to scan and estimate their value.
          Make sure the item is well-lit and clearly visible.
        </p>
        <ItemScanner />
      </div>
    </div>
  )
} 