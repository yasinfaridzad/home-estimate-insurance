import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { detectObjects } from '@/lib/ml/objectDetection'

const prisma = new PrismaClient()

// Estimated values for different categories (in a real app, this would come from a pricing database)
const categoryValues = {
  furniture: {
    chair: 150,
    couch: 899,
    bed: 1200,
    'dining table': 500,
    bench: 200,
  },
  electronics: {
    tv: 800,
    laptop: 1200,
    'cell phone': 700,
    keyboard: 100,
    mouse: 50,
  },
  appliances: {
    refrigerator: 1500,
    microwave: 200,
    oven: 1000,
    toaster: 50,
  },
  other: 100,
}

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { imageData } = await request.json()
    
    // Get user first to pass ID to detection
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Detect objects in the image with user ID for custom model training
    const detectedObjects = await detectObjects(imageData, user.id)
    
    if (detectedObjects.length === 0) {
      return NextResponse.json({ error: 'No objects detected' }, { status: 400 })
    }

    // Get the most confident detection
    const mainObject = detectedObjects.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    )

    // Estimate value based on category and item type
    const categoryPrices = categoryValues[mainObject.category as keyof typeof categoryValues] || categoryValues.other
    const estimatedValue = typeof categoryPrices === 'object' 
      ? (categoryPrices[mainObject.name as keyof typeof categoryPrices] || categoryValues.other)
      : categoryPrices

    // Create item in database
    const item = await prisma.item.create({
      data: {
        name: mainObject.name,
        category: mainObject.category,
        estimatedValue,
        condition: 'Good', // In a real app, this would be determined by image analysis
        confidence: mainObject.confidence,
        imageUrl: imageData,
        userId: user.id,
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error recognizing item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 