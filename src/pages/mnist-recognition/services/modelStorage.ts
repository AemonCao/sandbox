import type * as tf from '@tensorflow/tfjs'

export interface ModelMetadata {
  name: string
  startTime: string
  totalTime: number
  epochs: number
  batches: number
  trainLoss: number
  trainAccuracy: number
  valLoss: number
  valAccuracy: number
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn()
  }
  catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return retry(fn, retries - 1)
    }
    throw error
  }
}

export async function saveModelWithMetadata(
  model: tf.LayersModel,
  metadata: ModelMetadata,
): Promise<void> {
  await retry(async () => {
    await model.save(`indexeddb://${metadata.name}`)
    const db = await openMetadataDB()
    await saveMetadata(db, metadata)
  })
}

export async function loadModelWithMetadata(name: string): Promise<{
  model: tf.LayersModel
  metadata: ModelMetadata
} | null> {
  try {
    const tf = await import('@tensorflow/tfjs')
    const [model, metadata] = await Promise.all([
      tf.loadLayersModel(`indexeddb://${name}`),
      getMetadata(name),
    ])
    return metadata ? { model, metadata } : null
  }
  catch {
    return null
  }
}

export async function listModels(): Promise<ModelMetadata[]> {
  const db = await openMetadataDB()
  return getAllMetadata(db)
}

export async function deleteModel(name: string): Promise<void> {
  const tf = await import('@tensorflow/tfjs')
  await Promise.all([
    tf.io.removeModel(`indexeddb://${name}`),
    deleteMetadata(name),
  ])
}

function openMetadataDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mnist-metadata', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('models'))
        db.createObjectStore('models', { keyPath: 'name' })
    }
  })
}

async function saveMetadata(db: IDBDatabase, metadata: ModelMetadata): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readwrite')
    const store = tx.objectStore('models')
    const request = store.put(metadata)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function getMetadata(name: string): Promise<ModelMetadata | null> {
  const db = await openMetadataDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readonly')
    const store = tx.objectStore('models')
    const request = store.get(name)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

async function getAllMetadata(db: IDBDatabase): Promise<ModelMetadata[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readonly')
    const store = tx.objectStore('models')
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function deleteMetadata(name: string): Promise<void> {
  const db = await openMetadataDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readwrite')
    const store = tx.objectStore('models')
    const request = store.delete(name)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
