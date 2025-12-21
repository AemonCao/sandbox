import type { SensorData } from './types'

export function useHardwareConcurrency() {
  const sensorData = ref<SensorData>({
    id: 'hardware-concurrency',
    name: '硬件并发',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function start() {
    const cores = navigator.hardwareConcurrency

    if (cores === undefined) {
      sensorData.value.error = '浏览器不支持Hardware Concurrency API'
      return
    }

    sensorData.value.status = 'available'
    sensorData.value.value = {
      cores: `${cores} 核心`,
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
