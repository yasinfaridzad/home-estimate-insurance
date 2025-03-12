'use client'

import React, { useState } from 'react'
import { Item } from '@prisma/client'

interface ItemFeedbackProps {
  item: Item
  onFeedbackSubmit: (feedback: { category: string; name: string }) => void
}

export default function ItemFeedback({ item, onFeedbackSubmit }: ItemFeedbackProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [category, setCategory] = useState(item.category)
  const [name, setName] = useState(item.name)

  const categories = [
    'furniture',
    'electronics',
    'appliances',
    'other'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFeedbackSubmit({ category, name })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-sm text-blue-600 hover:underline mt-2"
      >
        Incorrect? Help us improve
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Item Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Submit Correction
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
} 