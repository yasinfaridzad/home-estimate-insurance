import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemName, imageData, bbox, confidence, detectedAs } = body

    if (!itemName || !imageData || !bbox || !detectedAs) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const [bboxX, bboxY, bboxWidth, bboxHeight] = bbox

    const trainingData = await prisma.trainingData.create({
      data: {
        itemName,
        imageData,
        bboxX,
        bboxY,
        bboxWidth,
        bboxHeight,
        confidence,
        detectedAs,
        userId: session.user.id
      }
    })

    return NextResponse.json(trainingData)
  } catch (error) {
    console.error('Error saving training data:', error)
    return NextResponse.json(
      { error: 'Failed to save training data' },
      { status: 500 }
    )
  }
}

// Get training data for a specific item
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemName = searchParams.get('itemName')

    const trainingData = await prisma.trainingData.findMany({
      where: {
        itemName: itemName || undefined,
        isVerified: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    // Convert the training data back to the format expected by the frontend
    const formattedData = trainingData.map(item => ({
      ...item,
      bbox: [item.bboxX, item.bboxY, item.bboxWidth, item.bboxHeight]
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('Error fetching training data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 