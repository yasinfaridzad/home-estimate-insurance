'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import ItemScanner from '@/components/itemRecognition/ItemScanner'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">HomeScan Insurance Estimator</h1>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
          Scan your household items and get instant insurance value estimates using AI technology.
        </p>
        <button
          onClick={() => signIn('google')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Sign out
        </button>
      </header>

      <nav className="mb-8">
        <ul className="flex space-x-4">
          <li>
            <Link href="/scan" className="text-blue-600 hover:underline">
              Scan Items
            </Link>
          </li>
          <li>
            <Link href="/reports" className="text-blue-600 hover:underline">
              View Reports
            </Link>
          </li>
          <li>
            <Link href="/settings" className="text-blue-600 hover:underline">
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      <main>
        <ItemScanner />
      </main>
    </div>
  )
} 