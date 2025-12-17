import type * as tf from '@tensorflow/tfjs'
import { defineStore } from 'pinia'

export interface TrainingProgress {
  epoch: number
  batch: number
  loss: number
  accuracy: number
  valLoss: number
  valAccuracy: number
  history: {
    loss: number[]
    accuracy: number[]
    valLoss: number[]
    valAccuracy: number[]
  }
}

export interface ModelMetadata {
  accuracy: number
  trainedAt: Date | null
  epochs: number
}

export const useMnistStore = defineStore('mnist', {
  state: () => ({
    model: null as tf.LayersModel | null,
    modelType: null as 'pretrained' | 'custom' | null,
    modelMetadata: {
      accuracy: 0,
      trainedAt: null,
      epochs: 0,
    } as ModelMetadata,
    predictions: Array.from({ length: 10 }).fill(0) as number[],
    isProcessing: false,
    isTraining: false,
    trainingProgress: {
      epoch: 0,
      batch: 0,
      loss: 0,
      accuracy: 0,
      valLoss: 0,
      valAccuracy: 0,
      history: {
        loss: [],
        accuracy: [],
        valLoss: [],
        valAccuracy: [],
      },
    } as TrainingProgress,
  }),

  actions: {
    setModel(model: tf.LayersModel, type: 'pretrained' | 'custom') {
      this.model = model
      this.modelType = type
    },

    clearPredictions() {
      this.predictions = Array.from({ length: 10 }).fill(0)
    },

    updatePredictions(predictions: number[]) {
      this.predictions = predictions
    },

    updateTrainingProgress(progress: Partial<TrainingProgress>) {
      Object.assign(this.trainingProgress, progress)
    },

    resetTrainingProgress() {
      this.trainingProgress = {
        epoch: 0,
        batch: 0,
        loss: 0,
        accuracy: 0,
        valLoss: 0,
        valAccuracy: 0,
        history: {
          loss: [],
          accuracy: [],
          valLoss: [],
          valAccuracy: [],
        },
      }
    },
  },
})
