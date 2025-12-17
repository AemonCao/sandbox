import type { ModelMetadata } from '../services/modelStorage'
import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'
import { listModels, loadModelWithMetadata, saveModelWithMetadata } from '../services/modelStorage'

export function useModel() {
  const store = useMnistStore()

  function createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [28, 28, 1],
          filters: 8,
          kernelSize: 3,
          activation: 'relu',
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          filters: 16,
          kernelSize: 3,
          activation: 'relu',
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 10, activation: 'softmax' }),
      ],
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })

    return model
  }

  async function saveModel(name?: string, startTime?: Date, totalTime?: number, batches?: number) {
    if (!store.model)
      return null

    const modelName = name || `mnist-model-${Date.now()}`

    try {
      const metadata: ModelMetadata = {
        name: modelName,
        startTime: startTime?.toISOString() || new Date().toISOString(),
        totalTime: totalTime || 0,
        epochs: store.modelMetadata.epochs,
        batches: batches || 0,
        trainLoss: store.trainingProgress.loss,
        trainAccuracy: store.trainingProgress.accuracy,
        valLoss: store.trainingProgress.valLoss,
        valAccuracy: store.trainingProgress.valAccuracy,
      }

      await saveModelWithMetadata(store.model as tf.LayersModel, metadata)
      return modelName
    }
    catch (error) {
      console.error('Failed to save model:', error)
      return null
    }
  }

  async function loadModel(name = 'mnist-model') {
    try {
      const result = await loadModelWithMetadata(name)
      if (!result)
        return false

      store.setModel(result.model, 'custom')
      store.modelMetadata = {
        accuracy: result.metadata.valAccuracy,
        trainedAt: new Date(result.metadata.startTime),
        epochs: result.metadata.epochs,
      }
      return true
    }
    catch (error) {
      console.error('Failed to load model:', error)
      return false
    }
  }

  async function checkModelExists(name = 'mnist-model') {
    try {
      const models = await listModels()
      return models.some(m => m.name === name)
    }
    catch {
      return false
    }
  }

  return {
    createModel,
    saveModel,
    loadModel,
    checkModelExists,
  }
}
