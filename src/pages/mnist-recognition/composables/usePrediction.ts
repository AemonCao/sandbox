import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'

export function usePrediction() {
  const store = useMnistStore()

  const predict = useDebounceFn(async (imageData: number[]) => {
    if (!store.model || imageData.length === 0)
      return

    store.isProcessing = true

    try {
      const normalized = imageData.map(v => v / 255)
      const tensor = tf.tensor4d(normalized, [1, 28, 28, 1])
      const predictions = store.model.predict(tensor) as tf.Tensor
      const probabilities = await predictions.data()

      store.updatePredictions(Array.from(probabilities))

      tensor.dispose()
      predictions.dispose()

      store.isProcessing = false
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
