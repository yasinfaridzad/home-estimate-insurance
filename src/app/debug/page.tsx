'use client'

import ScannerDebugger from '@/components/itemRecognition/ScannerDebugger'

export default function DebugPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Scanner Debug Page</h1>
      <ScannerDebugger />
    </div>
  )
} 