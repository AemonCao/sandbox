import type { LoadComplete, LoadError, LoadProgress } from '../workers/dataLoader.worker'
import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'
import DataLoaderWorker from '../workers/dataLoader.worker?worker'
import '@tensorflow/tfjs-backend-webgl'

export interface TrainingParams {
  epochs?: number
  batchSize?: number
  validationSplit?: number
  onProgress?: (stage: string, progress: number) => void
}

let abortController: AbortController | null = null

export function useTraining() {
  const store = useMnistStore()

  async function loadMnistData(onProgress?: (stage: string, progress: number) => void) {
    return new Promise<{ images: tf.Tensor4D, labels: tf.Tensor2D }>((resolve, reject) => {
      const worker = new DataLoaderWorker()

      worker.onmessage = (e: MessageEvent<LoadProgress | LoadComplete | LoadError>) => {
        const msg = e.data

        if (msg.type === 'progress') {
          onProgress?.(msg.stage, msg.progress)
        }
        else if (msg.type === 'complete') {
          const images = tf.tensor4d(msg.images, [msg.numImages, 28, 28, 1])
          const labels = tf.oneHot(tf.tensor1d(Array.from(msg.labels), 'int32'), 10) as tf.Tensor2D
          worker.terminate()
          resolve({ images, labels })
        }
        else if (msg.type === 'error') {
          worker.terminate()
          reject(new Error(msg.message))
        }
      }

      worker.onerror = (error) => {
        worker.terminate()
        reject(error)
      }

      worker.postMessage({ maxImages: 5000 })
    })
  }

  async function trainModel(params: TrainingParams = {}) {
    const { epochs = 10, batchSize = 128, validationSplit = 0.15, onProgress } = params

    if (!store.model) {
      console.error('No model to train')
      return false
    }

    abortController = new AbortController()
    store.isTraining = true
    store.resetTrainingProgress()

    try {
      const data = await loadMnistData(onProgress)

      if (abortController.signal.aborted) {
        data.images.dispose()
        data.labels.dispose()
        return false
      }

      await store.model.fit(data.images, data.labels, {
        epochs,
        batchSize,
        validationSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (abortController?.signal.aborted)
              return

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
            if (abortController?.signal.aborted)
              return
            store.updateTrainingProgress({ batch })
          },
        },
      })

      data.images.dispose()
      data.labels.dispose()

      if (abortController.signal.aborted)
        return false

      store.modelMetadata = {
        accuracy: store.trainingProgress.valAccuracy,
        trainedAt: new Date(),
        epochs,
      }

      store.isTraining = false
      abortController = null
      return true
    }
    catch (error) {
      console.error('Training error:', error)
      store.isTraining = false
      abortController = null
      return false
    }
  }

  function cancelTraining() {
    abortController?.abort()
    store.isTraining = false
    abortController = null
  }

  return {
    trainModel,
    cancelTraining,
  }
}
