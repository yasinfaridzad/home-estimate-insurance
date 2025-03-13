'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-800">
            Home Insurance
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/scan"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Scan Items
            </Link>
            <Link
              href="/reports"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reports
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 