'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/navigation/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSignInPage = pathname === '/auth/signin'

  return (
    <div className={`min-h-screen ${isSignInPage ? '' : 'bg-gray-50'}`}>
      {!isSignInPage && <Navbar />}
      <main className={isSignInPage ? 'min-h-screen' : 'py-8'}>
        {children}
      </main>
    </div>
  )
} 