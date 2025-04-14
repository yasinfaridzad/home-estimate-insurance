'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Item {
  id: string
  name: string
  correctedName?: string
  confidence: number
  imageData?: string
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
          const response = await fetch('/api/items')
          const responseText = await response.text()
          if (response.ok) {
            const data = JSON.parse(responseText)
            setItems(data)
          } else {
            console.error('Failed to fetch items:', response.status)
          }
        } catch (error) {
          console.error('Error fetching items:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    if (status !== 'loading') {
      fetchItems()
    }
  }, [session, status])

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      if (res.ok) setItems(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleCorrection = async (itemId: string, correctedName: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctedName })
      })
      if (res.ok) {
        setItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, correctedName } : item
          )
        )
      } else {
        console.error('Feedback speichern fehlgeschlagen')
      }
    } catch (err) {
      console.error('Correction failed', err)
    }
  }

  const handleExportCSV = () => {
    const header = 'Name,Korrigierter Name,Confidence (%),Wert (€),Datum\n'
    const rows = items.map(i => `"${i.name}","${i.correctedName || ''}",${Math.round(i.confidence * 100)},${getItemValue(i)},${new Date(i.createdAt).toLocaleDateString()}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    saveAs(blob, 'scan-report.csv')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('Scan Report', 14, 16)

    const tableData = items.map((i, idx) => [
      idx + 1,
      i.name,
      i.correctedName || '-',
      `${Math.round(i.confidence * 100)}%`,
      `€${getItemValue(i)}`,
      new Date(i.createdAt).toLocaleDateString()
    ])

    autoTable(doc, {
      head: [['#', 'Name', 'Korrigiert', 'Confidence', 'Wert', 'Datum']],
      body: tableData,
      startY: 20
    })

    doc.save('scan-report.pdf')
  }

  const getItemValue = (item: Item): number => {
    const baseValues: Record<string, number> = {
      chair: 200, sofa: 800, tv: 600, laptop: 1000, refrigerator: 1200
    }
    const key = (item.correctedName || item.name).toLowerCase()
    const base = baseValues[key] || 100
    return Math.round(base * item.confidence)
  }

  if (status === 'loading' || loading) return <div>Loading...</div>
  if (!session?.user) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scan Reports</h2>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="text-sm text-blue-600 hover:underline"
          >
            Export als CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="text-sm text-blue-600 hover:underline"
          >
            Export als PDF
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h3 className="font-semibold text-lg mb-4">Items</h3>
        <ul className="divide-y">
          {items.map(item => (
            <li key={item.id} className="py-4 flex gap-4 items-start justify-between">
              {item.imageData && (
                <img
                  src={item.imageData}
                  alt={item.name}
                  className="w-20 h-20 object-contain border rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {item.correctedName ? (
                    <>
                      <span className="line-through text-red-500">{item.name}</span>{' '}
                      <span className="text-green-700">{item.correctedName}</span>
                    </>
                  ) : (
                    item.name
                  )}
                </p>
                <p className="text-sm text-gray-500">Confidence: {Math.round(item.confidence * 100)}%</p>
                <p className="text-sm text-gray-500">Wert: €{getItemValue(item)}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {!item.correctedName && (
                  <form onSubmit={e => {
                    e.preventDefault()
                    const target = e.target as HTMLFormElement
                    const input = target.elements.namedItem('correction') as HTMLInputElement
                    handleCorrection(item.id, input.value)
                    input.value = ''
                  }}>
                    <Input
                      type="text"
                      name="correction"
                      placeholder="Korrektur"
                      className="w-32"
                    />
                    <button type="submit" className="mt-1 text-sm text-blue-600 hover:underline">Speichern</button>
                  </form>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
