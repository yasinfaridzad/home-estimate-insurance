'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const fetchItems = async () => {
      if (session?.user) {
        try {
          console.log('Starting to fetch items:', {
            sessionUser: session.user,
            status
          });
          
          const response = await fetch('/api/items')
          console.log('Fetch response status:', response.status);
          
          const responseText = await response.text()
          console.log('Raw response:', responseText);
          
          if (response.ok) {
            const data = JSON.parse(responseText)
            console.log('Parsed items:', data);
            setItems(data)
          } else {
            console.error('Failed to fetch items:', {
              status: response.status,
              response: responseText
            });
          }
        } catch (error) {
          console.error('Error fetching items:', error)
        } finally {
          setLoading(false)
        }
      } else {
        console.log('No session user available yet');
        setLoading(false)
      }
    }

    if (status !== 'loading') {
      fetchItems()
    }
  }, [session, status])

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      console.log('Attempting to delete item:', itemId);
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Successfully deleted item:', itemId);
        setItems(prev => prev.filter(item => item.id !== itemId))
      } else {
        const errorData = await response.json();
        console.error('Failed to delete item:', errorData.error);
        alert(`Failed to delete item: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.');
    }
  }

  const getItemValue = (item: Item): number => {
    // Simple value estimation based on item type and confidence
    const baseValues: { [key: string]: number } = {
      'bed': 500,
      'chair': 200,
      'table': 300,
      'sofa': 800,
      'laptop': 1000,
      'tv': 800,
      'refrigerator': 1200,
      'microwave': 200,
      'oven': 500,
      'sink': 300,
      'toilet': 400,
      'bathtub': 600,
      'cabinet': 400,
      'bookshelf': 300,
      'desk': 250,
      'door': 300,
      'window': 200,
      'lamp': 100,
      'clock': 50,
      'vase': 100,
      'bottle': 20,
      'cup': 15,
      'bowl': 25,
      'book': 20,
      'phone': 500,
      'keyboard': 100,
      'mouse': 50,
      'monitor': 300,
      'backpack': 100,
      'umbrella': 50,
      'handbag': 150,
      'tie': 50,
      'suitcase': 200,
      'frisbee': 20,
      'skis': 300,
      'snowboard': 400,
      'sports ball': 30,
      'kite': 40,
      'baseball bat': 50,
      'baseball glove': 100,
      'skateboard': 150,
      'surfboard': 400,
      'tennis racket': 100,
      'bicycle': 500,
      'motorcycle': 5000,
      'car': 25000,
      'truck': 35000,
      'bus': 50000,
      'train': 100000,
      'airplane': 1000000,
      'boat': 50000,
      'traffic light': 500,
      'fire hydrant': 1000,
      'stop sign': 200,
      'parking meter': 500,
      'bench': 300,
      'bird': 50,
      'cat': 100,
      'dog': 200,
      'horse': 5000,
      'sheep': 500,
      'cow': 2000,
      'elephant': 10000,
      'bear': 5000,
      'zebra': 5000,
      'giraffe': 8000,
      'wine glass': 30,
      'fork': 10,
      'knife': 15,
      'spoon': 10,
      'banana': 2,
      'apple': 2,
      'sandwich': 5,
      'orange': 2,
      'broccoli': 3,
      'carrot': 1,
      'hot dog': 5,
      'pizza': 15,
      'donut': 3,
      'cake': 20,
      'couch': 800,
      'potted plant': 100,
      'dining table': 300,
      'remote': 30,
      'cell phone': 500,
      'toaster': 50,
      'scissors': 20,
      'teddy bear': 30,
      'hair drier': 50,
      'toothbrush': 10,
    }

    const baseValue = baseValues[item.name.toLowerCase()] || 100
    return Math.round(baseValue * item.confidence)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const totalValue = items.reduce((sum, item) => sum + getItemValue(item), 0)
  const lastScan = items.length > 0
    ? new Date(items[0].createdAt).toLocaleDateString()
    : 'No scans yet'

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Scan Reports
          </h2>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Total Items</h3>
                  <p className="mt-1 text-3xl font-semibold text-blue-600">{items.length}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Total Value</h3>
                  <p className="mt-1 text-3xl font-semibold text-green-600">€{totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Scanned Items
                </h3>
                <button
                  onClick={() => {
                    const csvContent = [
                      ['Item Name', 'Confidence', 'Value (€)', 'Date'],
                      ...items.map(item => [
                        item.name,
                        `${Math.round(item.confidence * 100)}%`,
                        getItemValue(item).toLocaleString(),
                        new Date(item.createdAt).toLocaleDateString()
                      ])
                    ].map(row => row.join(',')).join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `scan-report-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Export as CSV
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="ml-2 text-sm text-gray-500">
                          (Confidence: {Math.round(item.confidence * 100)}%)
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-900">
                          €{getItemValue(item).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="ml-4 text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 