import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, isCorrect, correctName, imageData, detectedName, confidence } = body

    // First, create or update the item
    const item = await prisma.item.upsert({
      where: { id: itemId },
      update: {
        name: isCorrect ? detectedName : correctName,
        confidence: isCorrect ? 1.0 : confidence,
      },
      create: {
        id: itemId,
        name: isCorrect ? detectedName : correctName,
        confidence: isCorrect ? 1.0 : confidence,
        userId: session.user.id,
      },
    })

    // Save feedback
    const feedback = await prisma.feedback.upsert({
      where: { itemId },
      update: {
        isCorrect,
        correctName: isCorrect ? undefined : correctName,
      },
      create: {
        itemId,
        isCorrect,
        correctName: isCorrect ? undefined : correctName,
      },
    })

    // Save training data
    if (imageData) {
      await prisma.trainingData.create({
        data: {
          itemId,
          imageData,
          detectedName,
          correctName: isCorrect ? undefined : correctName,
          confidence,
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