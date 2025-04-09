import * as tf from '@tensorflow/tfjs-node'
import { PrismaClient, Item } from '@prisma/client'
import { loadImage, createCanvas } from 'canvas'

const prisma = new PrismaClient()

// Keep track of our custom model
let customModel: tf.LayersModel | null = null

interface TrainingData {
  image: tf.Tensor3D
  label: string
}

export async function trainModelOnUserData(userId: string) {
  try {
    // Get all user's items with confirmed identifications
    const items = await prisma.item.findMany({
      where: {
        userId,
        confidence: {
          gte: 0.8 // Only use high-confidence items for training
        }
      }
    })

    if (items.length < 5) {
      console.log('Not enough training data yet')
      return
    }

    // Prepare training data
    const trainingData = await prepareTrainingData(items)
    
    // Initialize or load custom model
    if (!customModel) {
      customModel = await createCustomModel()
    }

    // Train the model
    await trainModel(customModel, trainingData)

    console.log('Model training completed')
  } catch (error) {
    console.error('Error training model:', error)
  }
}

async function prepareTrainingData(items: Item[]): Promise<TrainingData[]> {
  const trainingData: TrainingData[] = []

  for (const item of items) {
    try {
      // Convert base64 image to tensor
      const imageData = item.imageUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(imageData, 'base64')
      const image = await loadImage(buffer)
      
      const canvas = createCanvas(224, 224) // Resize to standard input size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, 224, 224)
      
      const tensor = tf.node.decodeImage(buffer)
      const normalized = tensor.toFloat().div(255.0)

      trainingData.push({
        image: normalized,
        label: item.category
      })

      tensor.dispose()
    } catch (error) {
      console.error('Error preparing training data for item:', item.id, error)
    }
  }

  return trainingData
}

async function createCustomModel(): Promise<tf.LayersModel> {
  // Load pre-trained MobileNet model
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  )

  // Freeze the base model layers
  for (const layer of baseModel.layers) {
    layer.trainable = false
  }

  // Create our custom model using transfer learning
  const model = tf.sequential()

  // Add the base model (excluding the top layer)
  model.add(tf.layers.globalAveragePooling2d({
    inputShape: [224, 224, 3]
  }))

  // Add our custom classification layers
  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu'
  }))
  model.add(tf.layers.dropout({ rate: 0.5 }))
  model.add(tf.layers.dense({
    units: Object.keys(getCategoryMap()).length,
    activation: 'softmax'
  }))

  // Compile the model
  model.compile({
    optimizer: tf.train.adam(0.0001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  })

  return model
}

async function trainModel(model: tf.LayersModel, trainingData: TrainingData[]) {
  // Prepare batches
  const batchSize = 32
  const epochs = 10

  const xs = tf.stack(trainingData.map(d => d.image))
  const ys = tf.oneHot(
    trainingData.map(d => getCategoryIndex(d.label)),
    Object.keys(getCategoryMap()).length
  )

  // Train the model
  await model.fit(xs, ys, {
    batchSize,
    epochs,
    shuffle: true,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`)
      }
    }
  })

  // Clean up tensors
  xs.dispose()
  ys.dispose()
}

function getCategoryMap() {
  return {
    furniture: 0,
    electronics: 1,
    appliances: 2,
    other: 3
  }
}

function getCategoryIndex(category: string): number {
  const map = getCategoryMap()
  return map[category as keyof typeof map] || map.other
}

export async function predictWithCustomModel(imageData: string): Promise<{ category: string; confidence: number } | null> {
  if (!customModel) {
    return null
  }

  try {
    // Prepare image
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const image = await loadImage(buffer)
    
    const canvas = createCanvas(224, 224)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, 224, 224)
    
    // Convert to tensor and normalize
    const tensor = tf.node.decodeImage(buffer)
    const normalized = tensor.toFloat().div(255.0)
    const batched = normalized.expandDims(0)

    // Get prediction
    const prediction = await customModel.predict(batched) as tf.Tensor
    const probabilities = await prediction.data()
    
    // Get highest probability category
    const maxProbability = Math.max(...probabilities)
    const categoryIndex = probabilities.indexOf(maxProbability)
    const categories = Object.entries(getCategoryMap())
    const category = categories.find(([_, index]) => index === categoryIndex)?.[0] || 'other'

    // Clean up tensors
    tensor.dispose()
    normalized.dispose()
    batched.dispose()
    prediction.dispose()

    return {
      category,
      confidence: maxProbability
    }
  } catch (error) {
    console.error('Error predicting with custom model:', error)
    return null
  }
} 