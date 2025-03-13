'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: false
      })
      router.replace('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Home Insurance Estimator</h1>
            {session && (
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>

          {session ? (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Start Scanning Your Items</h2>
                <p className="text-gray-600 mb-4">
                  Use our advanced AI-powered scanner to identify and catalog your household items.
                </p>
                <Link
                  href="/scan"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Scanner
                </Link>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">View Reports</h2>
                <p className="text-gray-600 mb-4">
                  Access detailed reports of your scanned items and insurance estimates.
                </p>
                <Link
                  href="/reports"
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Reports
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-4">Welcome to Home Insurance Estimator</h2>
              <p className="text-gray-600 mb-6">
                Sign in to start managing your home insurance inventory with our AI-powered scanner.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In to Continue
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 