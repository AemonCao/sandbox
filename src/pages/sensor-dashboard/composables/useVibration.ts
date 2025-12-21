import type { SensorData } from './types'

export function useVibration() {
  const sensorData = ref<SensorData>({
    id: 'vibration',
    name: '振动',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function start() {
    if (!('vibrate' in navigator)) {
      sensorData.value.error = '浏览器不支持Vibration API'
      return
    }

    sensorData.value.status = 'available'
    sensorData.value.value = {
      supported: '支持',
    }
    sensorData.value.lastUpdate = Date.now()
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
