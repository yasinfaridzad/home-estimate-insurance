import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error('Unauthorized delete attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemId = params.id
    console.log('Attempting to delete item:', itemId, 'for user:', session.user.id)

    // First check if the item belongs to the user
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true }
    })

    if (!item) {
      console.error('Item not found:', itemId)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.userId !== session.user.id) {
      console.error('User does not own item:', itemId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the item and its associated feedback and training data
    await prisma.item.delete({
      where: { id: itemId },
    })

    console.log('Successfully deleted item:', itemId)
    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
} 