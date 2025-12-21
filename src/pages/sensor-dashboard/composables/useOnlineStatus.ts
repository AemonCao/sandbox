import type { SensorData } from './types'

export function useOnlineStatus() {
  const sensorData = ref<SensorData>({
    id: 'online-status',
    name: '在线状态',
    status: 'available',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function updateStatus() {
    sensorData.value.value = {
      status: navigator.onLine ? '在线' : '离线',
    }
    sensorData.value.lastUpdate = Date.now()
  }

  function start() {
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
  }

  function stop() {
    window.removeEventListener('online', updateStatus)
    window.removeEventListener('offline', updateStatus)
  }

  return {
    sensorData,
    start,
    stop,
  }
}
