// Neue Reports-Seite mit Bildern, Suche, Sortierung und Export
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { saveAs } from 'file-saver'

interface Item {
  id: string
  name: string
  correctedName?: string
  confidence: number
  estimatedValue: number
  imageData?: string
  createdAt: string // ✅ neu!
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [filtered, setFiltered] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date')

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        setItems(data)
        setFiltered(data)
      })
  }, [])

  useEffect(() => {
    let data = [...items]
  
    // 🔍 Suche
    if (search) {
      data = data.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.correctedName?.toLowerCase().includes(search.toLowerCase())
      )
    }
  
    // 🔢 Sortierung
    if (sortBy === 'price') {
      data.sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0))
    } else if (sortBy === 'name') {
      data.sort((a, b) =>
        (a.correctedName || a.name).localeCompare(b.correctedName || b.name)
      )
    } else {
      data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
  
    setFiltered(data)
  }, [search, sortBy, items])

  const handleDelete = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleExportCSV = () => {
    const header = 'Name,Korrigierter Name,Confidence (%),Preis (€),Datum\n'
    const rows = filtered.map(i =>
      `${i.name},"${i.correctedName ?? ''}",${Math.round(i.confidence * 100)},${i.estimatedValue ?? ''},${new Date(i.createdAt).toLocaleDateString()}`
    )
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, 'report.csv')
  }
  
  const handleExportPDF = async () => {
    const response = await fetch('/api/reports/pdf')
    if (!response.ok) {
      alert('Fehler beim PDF-Export')
      return
    }
  
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.pdf'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports Übersicht</h2>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV}>Export CSV</Button>
          <a href="/api/reports/pdf" target="_blank" rel="noopener noreferrer">
            <Button>Export PDF</Button>
           </a>
        </div>

      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Suche nach Objektname..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border p-2 rounded">
          <option value="date">Sortieren nach: Datum</option>
          <option value="price">Preis</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white p-4 rounded shadow space-y-2">
            {item.imageData && <img src={item.imageData} alt={item.name} className="w-full h-40 object-contain rounded" />}
            <h3 className="font-bold text-lg">{item.correctedName || item.name}</h3>
            <p>Confidence: {Math.round(item.confidence * 100)}%</p>
            <p>Preis: €{item.estimatedValue}</p>
            <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
            <Button variant="destructive" onClick={() => handleDelete(item.id)}>Löschen</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
