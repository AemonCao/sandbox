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

/**
 * 重试执行异步函数
 *
 * @template T
 * @param {() => Promise<T>} fn 要执行的异步函数
 * @param {number} retries 剩余重试次数
 * @return {Promise<T>} 函数执行结果
 */
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

/**
 * 保存模型及其元数据到IndexedDB
 *
 * @param {tf.LayersModel} model TensorFlow.js模型对象
 * @param {ModelMetadata} metadata 模型元数据
 * @param {string} metadata.name 模型名称
 * @param {string} metadata.startTime 训练开始时间
 * @param {number} metadata.totalTime 总训练时间（毫秒）
 * @param {number} metadata.epochs 训练轮数
 * @param {number} metadata.batches 批次数
 * @param {number} metadata.trainLoss 训练损失
 * @param {number} metadata.trainAccuracy 训练准确率
 * @param {number} metadata.valLoss 验证损失
 * @param {number} metadata.valAccuracy 验证准确率
 * @return {Promise<void>}
 */
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

/**
 * 从IndexedDB加载模型及其元数据
 *
 * @param {string} name 模型名称
 * @return {Promise<{model: tf.LayersModel, metadata: ModelMetadata} | null>} 模型和元数据对象，如果不存在则返回null
 */
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

/**
 * 获取所有已保存的模型元数据列表
 *
 * @return {Promise<ModelMetadata[]>} 模型元数据数组
 */
export async function listModels(): Promise<ModelMetadata[]> {
  const db = await openMetadataDB()
  return getAllMetadata(db)
}

/**
 * 删除指定的模型及其元数据
 *
 * @param {string} name 模型名称
 * @return {Promise<void>}
 */
export async function deleteModel(name: string): Promise<void> {
  const tf = await import('@tensorflow/tfjs')
  await Promise.all([
    tf.io.removeModel(`indexeddb://${name}`),
    deleteMetadata(name),
  ])
}

/**
 * 打开元数据数据库
 *
 * @return {Promise<IDBDatabase>} IndexedDB数据库实例
 */
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

/**
 * 保存模型元数据到数据库
 *
 * @param {IDBDatabase} db 数据库实例
 * @param {ModelMetadata} metadata 模型元数据
 * @return {Promise<void>}
 */
async function saveMetadata(db: IDBDatabase, metadata: ModelMetadata): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readwrite')
    const store = tx.objectStore('models')
    const request = store.put(metadata)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * 从数据库获取指定模型的元数据
 *
 * @param {string} name 模型名称
 * @return {Promise<ModelMetadata | null>} 模型元数据，如果不存在则返回null
 */
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

/**
 * 从数据库获取所有模型的元数据
 *
 * @param {IDBDatabase} db 数据库实例
 * @return {Promise<ModelMetadata[]>} 所有模型元数据数组
 */
async function getAllMetadata(db: IDBDatabase): Promise<ModelMetadata[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readonly')
    const store = tx.objectStore('models')
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * 从数据库删除指定模型的元数据
 *
 * @param {string} name 模型名称
 * @return {Promise<void>}
 */
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
