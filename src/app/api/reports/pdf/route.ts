import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.item.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const title = 'Inventar-Report'
  page.drawText(title, {
    x: 50,
    y: 760,
    size: 18,
    font,
    color: rgb(0, 0, 0),
  })

  const startY = 730
  let y = startY

  items.forEach((item, idx) => {
    const text = `${idx + 1}. ${item.correctedName || item.name} - ${Math.round(item.confidence * 100)}% - €${item.estimatedValue ?? 0} - ${new Date(item.createdAt).toLocaleDateString()}`
    page.drawText(text, {
      x: 50,
      y: y,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    })
    y -= 20
    if (y < 50) {
      y = startY
      pdfDoc.addPage()
    }
  })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=report.pdf',
    },
  })
}
