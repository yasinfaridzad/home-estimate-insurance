import type { NextApiRequest, NextApiResponse } from 'next'
import { detectObjects } from '@/lib/ai/detector' // Pfad anpassen, je nachdem, wo dein Code liegt
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]' // Passe das an deinen Auth-Pfad an

const imageData = fs.readFileSync('test-image.jpg', { encoding: 'base64' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageData } = req.body

  if (!imageData) {
    return res.status(400).json({ error: 'Missing image data' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const userId = session?.user?.id

    const detected = await detectObjects(imageData, userId ?? undefined)
    console.log('DETECTED OBJECTS:', detected)


    if (!detected || detected.length === 0) {
      return res.status(200).json({ message: 'No objects detected' })
    }

    // Rückgabe nur des ersten erkannten Objekts (oder alle, je nach Bedarf)
    return res.status(200).json(detected[0])
  } catch (error) {
    console.error('API Prediction Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

