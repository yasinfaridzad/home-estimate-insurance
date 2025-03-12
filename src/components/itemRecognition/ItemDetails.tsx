'use client'

import React, { useState } from 'react'
import { Item } from '@prisma/client'
import ItemFeedback from './ItemFeedback'

export default function ItemDetails({ imageData }: { imageData?: string }) {
  const [itemDetails, setItemDetails] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const analyzeImage = async () => {
    if (!imageData) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/items/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to analyze image')
      }

      const data = await response.json()
      setItemDetails(data)
    } catch (error) {
      console.error('Error analyzing image:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (feedback: { category: string; name: string }) => {
    if (!itemDetails) return

    try {
      const response = await fetch(`/api/items/${itemDetails.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      const updatedItem = await response.json()
      setItemDetails(updatedItem)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError('Failed to submit feedback')
    }
  }

  if (!imageData) {
    return null
  }

  return (
    <div className="mt-8">
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : itemDetails ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">{itemDetails.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Category</p>
              <p className="font-medium">{itemDetails.category}</p>
            </div>
            <div>
              <p className="text-gray-600">Estimated Value</p>
              <p className="font-medium">${itemDetails.estimatedValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Condition</p>
              <p className="font-medium">{itemDetails.condition}</p>
            </div>
            <div>
              <p className="text-gray-600">Confidence</p>
              <p className="font-medium">{(itemDetails.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
          
          <ItemFeedback item={itemDetails} onFeedbackSubmit={handleFeedback} />

          <button
            onClick={() => setItemDetails(null)}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Scan Another Item
          </button>
        </div>
      ) : (
        <button
          onClick={analyzeImage}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Analyze Image
        </button>
      )}
    </div>
  )
} 