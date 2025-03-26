'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ItemScanner from '@/components/itemRecognition/ItemScanner'

export default function ScanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading scanner...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-5 sm:px-0">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Scan Your Items</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Use your camera to scan and identify household items
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Tip:</span> Ensure good lighting for better detection
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">How to use the scanner</h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Click "Start Scanning" to activate your camera</li>
                        <li>Position the item in the frame</li>
                        <li>Click "Detect Items" to analyze the image</li>
                        <li>Confirm or correct the detected items</li>
                        <li>View your scanned items in the Reports section</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <ItemScanner />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 