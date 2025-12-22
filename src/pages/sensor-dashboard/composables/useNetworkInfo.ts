import type { SensorData } from './types'
import { MAX_HISTORY_POINTS, SAMPLE_INTERVAL } from './useSensorConfig'

export function useNetworkInfo() {
  const sensorData = ref<SensorData>({
    id: 'network',
    name: '网络信息',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
    chartFields: ['downlink', 'rtt'],
    chartMin: 0,
    chartMax: 100,
  })

  const downlinkHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))
  const rttHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))

  let intervalId: number | null = null

  function updateNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      if (connection.downlink !== undefined) {
        downlinkHistory.value.push(connection.downlink)
        if (downlinkHistory.value.length > MAX_HISTORY_POINTS)
          downlinkHistory.value.shift()
      }

      if (connection.rtt !== undefined) {
        rttHistory.value.push(connection.rtt)
        if (rttHistory.value.length > MAX_HISTORY_POINTS)
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
    intervalId = window.setInterval(updateNetworkInfo, SAMPLE_INTERVAL)
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return {
    sensorData,
    start,
    stop,
  }
}
