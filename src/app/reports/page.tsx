'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Report {
  id: string
  title: string
  createdAt: string
  pdfUrl?: string
}

export default function Reports() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (session) {
      fetchReports()
    }
  }, [session])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }
      const data = await response.json()
      setReports(data)
    } catch (error) {
      setError('Failed to load reports')
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Home Inventory Report - ${new Date().toLocaleDateString()}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const newReport = await response.json()
      setReports(prev => [newReport, ...prev])
    } catch (error) {
      setError('Failed to generate report')
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view reports.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Insurance Reports</h1>
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isGenerating ? 'Generating...' : 'Generate New Report'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No reports generated yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Generate a report to get started with your home inventory documentation.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">{report.title}</h3>
                <p className="text-sm text-gray-500">
                  Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                {report.pdfUrl && (
                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Download PDF
                  </a>
                )}
                <button
                  onClick={() => window.open(`/reports/${report.id}`, '_blank')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 