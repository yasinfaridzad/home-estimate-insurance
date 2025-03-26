'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  totalItems: number
  totalValue: number
  recentScans: number
  accuracy: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalValue: 0,
    recentScans: 0,
    accuracy: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/items')
          const items = await response.json()
          
          // Calculate statistics
          const totalValue = items.reduce((sum: number, item: any) => {
            const baseValue = getBaseValue(item.name)
            return sum + Math.round(baseValue * item.confidence)
          }, 0)

          setStats({
            totalItems: items.length,
            totalValue,
            recentScans: items.filter((item: any) => {
              const scanDate = new Date(item.createdAt)
              const today = new Date()
              return scanDate.toDateString() === today.toDateString()
            }).length,
            accuracy: calculateAccuracy(items)
          })
        } catch (error) {
          console.error('Error fetching stats:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (status !== 'loading') {
      fetchStats()
    }
  }, [session, status])

  const getBaseValue = (itemName: string): number => {
    const baseValues: { [key: string]: { [key: string]: number } | number } = {
      furniture: {
        chair: 150,
        couch: 899,
        bed: 1200,
        'dining table': 500,
        bench: 200,
      },
      electronics: {
        tv: 800,
        laptop: 1200,
        'cell phone': 700,
        keyboard: 100,
        mouse: 50,
      },
      appliances: {
        refrigerator: 1500,
        microwave: 200,
        oven: 1000,
        toaster: 50,
      },
    }

    const categoryPrices = baseValues[itemName.toLowerCase()]
    if (!categoryPrices) return 100

    return typeof categoryPrices === 'object' 
      ? (categoryPrices[itemName.toLowerCase()] || 100)
      : categoryPrices
  }

  const calculateAccuracy = (items: any[]): number => {
    if (items.length === 0) return 0
    const correctItems = items.filter(item => item.confidence > 0.8).length
    return Math.round((correctItems / items.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-gray-600">Please sign in to view the dashboard</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-5 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {session?.user?.name || 'User'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.totalItems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-lg font-semibold text-gray-900">€{stats.totalValue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Scans</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.recentScans}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Detection Accuracy</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.accuracy}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/scan"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start New Scan
                </Link>
                <Link
                  href="/reports"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  View Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 