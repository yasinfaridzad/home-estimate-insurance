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

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Load image
    const image = await loadImage(buffer)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)

    // Get predictions from COCO-SSD model
    const tensor = tf.browser.fromPixels(canvas)
    const predictions = await model!.detect(tensor)
    
    // Get prediction from our custom model
    const customPrediction = userId ? await predictWithCustomModel(imageData) : null

    // Clean up
    tensor.dispose()

    // Combine predictions
    const detectedObjects = predictions.map(pred => ({
      name: pred.class,
      category: getCategoryFromClass(pred.class),
      confidence: pred.score,
      bbox: pred.bbox as [number, number, number, number]
    }))

    // If we have a custom prediction with high confidence, use it to refine the category
    if (customPrediction && customPrediction.confidence > 0.5) {
      detectedObjects.forEach(obj => {
        obj.category = customPrediction.category
        // Boost confidence if custom model agrees
        if (obj.category === customPrediction.category) {
          obj.confidence = (obj.confidence + customPrediction.confidence) / 2
        }
      })
    }

    // If we have a userId, trigger async model training
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
    appliances: ['refrigerator', 'microwave', 'oven', 'toaster'],
    // Add more categories as needed
  }

  for (const [category, items] of Object.entries(categories)) {
    if (items.includes(className.toLowerCase())) {
      return category
    }
  }

  return 'other'
} 