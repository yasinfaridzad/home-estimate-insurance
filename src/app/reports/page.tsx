'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Item {
  id: string
  name: string
  confidence: number
  createdAt: string
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items')
        if (!response.ok) {
          throw new Error('Failed to fetch items')
        }
        const data = await response.json()
        setItems(data)
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchItems()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return null
  }

  const totalValue = items.reduce((sum, item) => {
    // Simple value estimation based on item type
    const baseValue = item.name.toLowerCase().includes('bed') ? 500 :
                     item.name.toLowerCase().includes('chair') ? 200 :
                     item.name.toLowerCase().includes('table') ? 300 : 100
    return sum + (baseValue * item.confidence)
  }, 0)

  const exportAsCSV = () => {
    // Create CSV content
    const headers = ['Item Name', 'Confidence', 'Scanned Date', 'Estimated Value']
    const rows = items.map(item => [
      item.name,
      `${Math.round(item.confidence * 100)}%`,
      new Date(item.createdAt).toLocaleString(),
      `$${Math.round(getItemValue(item))}`
    ])
    
    // Add summary row
    const summaryRow = [
      'TOTAL',
      '',
      '',
      `$${Math.round(totalValue)}`
    ]
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      summaryRow.join(',')
    ].join('\n')
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'scan-report.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getItemValue = (item: Item) => {
    const baseValue = item.name.toLowerCase().includes('bed') ? 500 :
                     item.name.toLowerCase().includes('chair') ? 200 :
                     item.name.toLowerCase().includes('table') ? 300 : 100
    return baseValue * item.confidence
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Scan Reports</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Scans</h2>
            <div className="space-y-4">
              {items.length === 0 ? (
                <p className="text-gray-500">No scans available yet. Start scanning items to see them here.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          Confidence: {Math.round(item.confidence * 100)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          Scanned: {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${Math.round(totalValue)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Last Scan</p>
                <p className="text-2xl font-bold">
                  {items.length > 0 
                    ? new Date(items[0].createdAt).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Export Options</h2>
          <div className="flex space-x-4">
            <button 
              onClick={exportAsCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Export as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 