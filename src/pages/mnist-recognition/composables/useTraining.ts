import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'

export interface TrainingParams {
  epochs?: number
  batchSize?: number
  validationSplit?: number
}

export function useTraining() {
  const store = useMnistStore()

  async function loadMnistData() {
    const MNIST_IMAGES_SPRITE_PATH = 'https://storage.googleapis.com/tfjs-tutorials/mnist_images.png'
    const MNIST_LABELS_PATH = 'https://storage.googleapis.com/tfjs-tutorials/mnist_labels_uint8'

    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    await new Promise((resolve) => {
      img.crossOrigin = ''
      img.onload = () => {
        img.width = img.naturalWidth
        img.height = img.naturalHeight
        resolve(null)
      }
      img.src = MNIST_IMAGES_SPRITE_PATH
    })

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imagesData = ctx.getImageData(0, 0, img.width, img.height)
    const numImages = img.height / 28

    const images = new Float32Array(numImages * 28 * 28)
    for (let i = 0; i < numImages; i++) {
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          const srcIdx = ((i * 28 + y) * img.width + x) * 4
          const dstIdx = i * 28 * 28 + y * 28 + x
          images[dstIdx] = imagesData.data[srcIdx] / 255
        }
      }
    }

    const labelsResponse = await fetch(MNIST_LABELS_PATH)
    const labelsData = new Uint8Array(await labelsResponse.arrayBuffer())

    return {
      images: tf.tensor4d(images, [numImages, 28, 28, 1]),
      labels: tf.oneHot(tf.tensor1d(Array.from(labelsData), 'int32'), 10),
    }
  }

  async function trainModel(params: TrainingParams = {}) {
    const {
      epochs = 10,
      batchSize = 128,
      validationSplit = 0.15,
    } = params

    if (!store.model) {
      console.error('No model to train')
      return false
    }

    store.isTraining = true
    store.resetTrainingProgress()

    try {
      const { images, labels } = await loadMnistData()

      await store.model.fit(images, labels, {
        epochs,
        batchSize,
        validationSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            store.updateTrainingProgress({
              epoch: epoch + 1,
              loss: logs?.loss || 0,
              accuracy: logs?.acc || 0,
              valLoss: logs?.val_loss || 0,
              valAccuracy: logs?.val_acc || 0,
            })
            store.trainingProgress.history.loss.push(logs?.loss || 0)
            store.trainingProgress.history.accuracy.push(logs?.acc || 0)
            store.trainingProgress.history.valLoss.push(logs?.val_loss || 0)
            store.trainingProgress.history.valAccuracy.push(logs?.val_acc || 0)
          },
          onBatchEnd: (batch) => {
            store.updateTrainingProgress({ batch })
          },
        },
      })

      store.modelMetadata = {
        accuracy: store.trainingProgress.valAccuracy,
        trainedAt: new Date(),
        epochs,
      }

      images.dispose()
      labels.dispose()

      store.isTraining = false
      return true
    }
    catch (error) {
      console.error('Training error:', error)
      store.isTraining = false
      return false
    }
  }

  return {
    trainModel,
  }
}
