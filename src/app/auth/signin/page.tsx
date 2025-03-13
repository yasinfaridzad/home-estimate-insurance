'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function SignIn() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.replace('/')
    }
  }, [session, router])

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

  const handleSignIn = async () => {
    try {
      const result = await signIn('google', { 
        callbackUrl: '/',
        redirect: false
      })
      
      if (result?.error) {
        console.error('Sign in error:', result.error)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to manage your home insurance inventory
            </p>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Image
              src="/google.svg"
              alt="Google"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
} 