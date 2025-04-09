import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, isCorrect, correctName, imageData, detectedName, confidence, bbox } = body

    if (!itemId || isCorrect === undefined) {
      return NextResponse.json(
        { error: 'Item ID and feedback status are required' },
        { status: 400 }
      )
    }

    // First, check if the item exists
    let item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      // If item doesn't exist, create it
      item = await prisma.item.create({
        data: {
          name: isCorrect ? detectedName : correctName,
          confidence: isCorrect ? 1.0 : confidence,
          userId: session.user.id,
          imageData: imageData || null
        },
      })
    } else {
      // If item exists, update it
      item = await prisma.item.update({
        where: { id: itemId },
        data: {
          name: isCorrect ? detectedName : correctName,
          confidence: isCorrect ? 1.0 : confidence,
          imageData: imageData || item.imageData
        },
      })
    }

    // Save feedback
    const feedback = await prisma.feedback.upsert({
      where: { itemId: item.id },
      update: {
        isCorrect,
        correctName: isCorrect ? undefined : correctName,
      },
      create: {
        itemId: item.id,
        isCorrect,
        correctName: isCorrect ? undefined : correctName,
      },
    })

    // Save training data
    if (imageData && bbox) {
      const [bboxX, bboxY, bboxWidth, bboxHeight] = bbox
      await prisma.trainingData.create({
        data: {
          itemName: isCorrect ? detectedName : correctName,
          imageData,
          bboxX,
          bboxY,
          bboxWidth,
          bboxHeight,
          confidence,
          detectedAs: detectedName,
          userId: session.user.id,
          isVerified: true
        },
      })
    }

    return NextResponse.json({ item, feedback })
  } catch (error) {
    console.error('Error saving feedback:', error)
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    )
  }
} 