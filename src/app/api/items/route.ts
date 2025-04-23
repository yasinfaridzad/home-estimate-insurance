import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getPriceFromSerpApi } from '@/lib/getPrice'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    name,
    confidence,
    imageData,
    userId,
    correctedName = null
  } = body

  try {
    const estimatedValue = await getPriceFromSerpApi(correctedName || name)

    const item = await prisma.item.create({
      data: {
        name,
        confidence,
        imageData,
        userId,
        correctedName,
        estimatedValue: estimatedValue ?? 100,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error saving item:', error)
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await prisma.item.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}
