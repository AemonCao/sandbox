import type { SensorData } from './types'

export function useNetworkInfo() {
  const sensorData = ref<SensorData>({
    id: 'network',
    name: '网络信息',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function updateNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      sensorData.value.status = 'available'
      sensorData.value.value = {
        effectiveType: connection.effectiveType || '未知',
        downlink: connection.downlink ? `${connection.downlink} Mbps` : '未知',
        rtt: connection.rtt ? `${connection.rtt} ms` : '未知',
        saveData: connection.saveData ? '开启' : '关闭',
      }
      sensorData.value.lastUpdate = Date.now()
    }
  }

  function start() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (!connection) {
      sensorData.value.error = '浏览器不支持Network Information API'
      return
    }

    updateNetworkInfo()
    connection.addEventListener('change', updateNetworkInfo)
  }

  function stop() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      connection.removeEventListener('change', updateNetworkInfo)
    }
  }

  return {
    sensorData,
    start,
    stop,
  }
}
