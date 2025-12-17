import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'

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

  async function saveModel(name = 'mnist-model') {
    if (!store.model)
      return

    try {
      await store.model.save(`indexeddb://${name}`)
      localStorage.setItem(`${name}-metadata`, JSON.stringify(store.modelMetadata))
      return true
    }
    catch (error) {
      console.error('Failed to save model:', error)
      return false
    }
  }

  async function loadModel(name = 'mnist-model') {
    try {
      const model = await tf.loadLayersModel(`indexeddb://${name}`)
      const metadataStr = localStorage.getItem(`${name}-metadata`)
      const metadata = metadataStr ? JSON.parse(metadataStr) : {}

      store.setModel(model, 'custom')
      store.modelMetadata = {
        accuracy: metadata.accuracy || 0,
        trainedAt: metadata.trainedAt ? new Date(metadata.trainedAt) : null,
        epochs: metadata.epochs || 0,
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
      const models = await tf.io.listModels()
      return `indexeddb://${name}` in models
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
