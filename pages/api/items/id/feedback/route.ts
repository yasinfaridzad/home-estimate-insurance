import { getToken } from 'next-auth/jwt'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  console.log('🧪 TOKEN:', token)

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { correctedName } = await req.json()
  const { id } = params

  if (!id || !correctedName) {
    return NextResponse.json({ error: 'Missing ID or correctedName' }, { status: 400 })
  }

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { correctedName }
    })

    console.log('✅ correctedName gespeichert:', updated.correctedName)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('🔥 Fehler beim Speichern:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
