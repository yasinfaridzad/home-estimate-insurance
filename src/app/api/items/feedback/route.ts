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
    const { itemId, isCorrect, correctName } = body

    if (!itemId || isCorrect === undefined) {
      return NextResponse.json(
        { error: 'Item ID and feedback status are required' },
        { status: 400 }
      )
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        itemId,
        isCorrect,
        correctName: correctName || null
      }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error saving feedback:', error)
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    )
  }
} 