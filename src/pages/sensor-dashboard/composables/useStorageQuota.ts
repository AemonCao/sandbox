import type { SensorData } from './types'

export function useStorageQuota() {
  const sensorData = ref<SensorData>({
    id: 'storage-quota',
    name: '存储配额',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  async function updateQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
      sensorData.value.error = '浏览器不支持Storage API'
      return
    }

    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? ((usage / quota) * 100).toFixed(2) : '0'

      sensorData.value.status = 'available'
      sensorData.value.value = {
        usage: `${(usage / 1024 / 1024).toFixed(2)} MB`,
        quota: `${(quota / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${percentage}%`,
      }
      sensorData.value.lastUpdate = Date.now()
    }
    catch {
      sensorData.value.status = 'error'
      sensorData.value.error = '无法获取存储配额信息'
    }
  }

  function start() {
    updateQuota()
  }

  function stop() {
    // 无需清理
  }

  return {
    sensorData,
    start,
    stop,
  }
}
