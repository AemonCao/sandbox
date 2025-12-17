import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'

export function usePrediction() {
  const store = useMnistStore()

  const predict = useDebounceFn(async (imageData: number[]) => {
    if (!store.model || imageData.length === 0)
      return

    store.isProcessing = true

    try {
      await tf.tidy(() => {
        const tensor = tf.tensor4d(imageData, [1, 28, 28, 1])
        const normalized = tensor.div(255.0)
        const predictions = store.model!.predict(normalized) as tf.Tensor
        predictions.data().then((probabilities) => {
          store.updatePredictions(Array.from(probabilities))
          store.isProcessing = false
        })
      })
    }
    catch (error) {
      console.error('Prediction error:', error)
      store.isProcessing = false
    }
  }, 300)

  return {
    predict,
  }
}
