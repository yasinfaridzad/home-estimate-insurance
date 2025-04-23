import { NextResponse } from 'next/server'

export async function GET() {
  const PDFDocument = require('pdfkit')
  const doc = new PDFDocument()
  const stream = doc.pipe(require('stream').PassThrough())

  doc.text('Hello World from PDFKit and Next.js')
  doc.end()

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="report.pdf"',
    },
  })
}
