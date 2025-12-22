import type { SensorData } from './types'

export function useNetworkInfo() {
  const sensorData = ref<SensorData>({
    id: 'network',
    name: '网络信息',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
    chartFields: ['downlink', 'rtt'],
  })

  const MAX_HISTORY = 30
  const downlinkHistory = ref<number[]>([])
  const rttHistory = ref<number[]>([])

  function updateNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      if (connection.downlink !== undefined) {
        downlinkHistory.value.push(connection.downlink)
        if (downlinkHistory.value.length > MAX_HISTORY)
          downlinkHistory.value.shift()
      }

      if (connection.rtt !== undefined) {
        rttHistory.value.push(connection.rtt)
        if (rttHistory.value.length > MAX_HISTORY)
          rttHistory.value.shift()
      }

      sensorData.value.status = 'available'
      sensorData.value.value = {
        effectiveType: connection.effectiveType || '未知',
        downlink: connection.downlink ? `${connection.downlink} Mbps` : '未知',
        rtt: connection.rtt ? `${connection.rtt} ms` : '未知',
        saveData: connection.saveData ? '开启' : '关闭',
      }
      ;(sensorData.value as any).downlinkHistory = downlinkHistory.value
      ;(sensorData.value as any).rttHistory = rttHistory.value
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
