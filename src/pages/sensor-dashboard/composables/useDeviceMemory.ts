import type { SensorData } from './types'

export function useDeviceMemory() {
  const sensorData = ref<SensorData>({
    id: 'device-memory',
    name: '设备内存',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function start() {
    const memory = (navigator as any).deviceMemory

    if (memory === undefined) {
      sensorData.value.error = '浏览器不支持Device Memory API'
      return
    }

    sensorData.value.status = 'available'
    sensorData.value.value = {
      memory: `${memory} GB`,
    }
    sensorData.value.lastUpdate = Date.now()
  }

  function stop() {
    // 静态数据，无需清理
  }

  return {
    sensorData,
    start,
    stop,
  }
}
