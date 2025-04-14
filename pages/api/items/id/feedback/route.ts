import { getToken } from 'next-auth/jwt'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const secret = process.env.NEXTAUTH_SECRET // 🛠️ wichtig!
  const token = await getToken({ req, secret })

  console.log('🧪 FEEDBACK DEBUG | token:', token)

  if (!token) {
    console.warn('❌ No token found – 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { correctedName } = await req.json()
  const { id } = params

  if (!id || !correctedName || typeof correctedName !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { correctedName }
    })

    console.log('✅ Correction saved:', updated.id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('🔥 Error saving correction:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
