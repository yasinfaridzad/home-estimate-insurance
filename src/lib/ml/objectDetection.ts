// detectObjects – serverkompatibel mit tf.node.decodeImage
import * as tf from '@tensorflow/tfjs-node'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import { createCanvas, loadImage } from 'canvas'
import { predictWithCustomModel, trainModelOnUserData } from './modelTraining'

let model: cocoSsd.ObjectDetection | null = null

export async function initializeModel() {
  if (!model) {
    model = await cocoSsd.load()
  }
  return model
}

export interface DetectedObject {
  name: string
  category: string
  confidence: number
  bbox: [number, number, number, number]
}

export async function detectObjects(imageData: string, userId?: string): Promise<DetectedObject[]> {
  try {
    if (!model) {
      await initializeModel()
    }

    // Convert base64 image data to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Decode image using tfjs-node (server-side compatible)
    const tensor = tf.node.decodeImage(buffer)

    // Get predictions from COCO-SSD model
    const predictions = await model!.detect(tensor as any)

    const customPrediction = userId ? await predictWithCustomModel(imageData) : null

    tensor.dispose()

    const detectedObjects = predictions.map(pred => ({
      name: pred.class,
      category: getCategoryFromClass(pred.class),
      confidence: pred.score,
      bbox: pred.bbox as [number, number, number, number]
    }))

    if (customPrediction && customPrediction.confidence > 0.5) {
      detectedObjects.forEach(obj => {
        obj.category = customPrediction.category
        if (obj.category === customPrediction.category) {
          obj.confidence = (obj.confidence + customPrediction.confidence) / 2
        }
      })
    }

    if (userId) {
      trainModelOnUserData(userId).catch(console.error)
    }

    return detectedObjects
  } catch (error) {
    console.error('Error detecting objects:', error)
    throw error
  }
}

function getCategoryFromClass(className: string): string {
  const categories = {
    furniture: ['chair', 'couch', 'bed', 'dining table', 'bench'],
    electronics: ['tv', 'laptop', 'cell phone', 'keyboard', 'mouse'],
    appliances: ['refrigerator', 'microwave', 'oven', 'toaster']
  }

  for (const [category, items] of Object.entries(categories)) {
    if (items.includes(className.toLowerCase())) {
      return category
    }
  }

  return 'other'
}
