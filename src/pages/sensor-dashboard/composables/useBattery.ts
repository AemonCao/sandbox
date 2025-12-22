import type { SensorData } from './types'
import { MAX_HISTORY_POINTS } from './useSensorConfig'

export function useBattery() {
  const sensorData = ref<SensorData>({
    id: 'battery',
    name: '电池状态',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
    chartFields: ['level'],
    chartMin: 0,
    chartMax: 100,
  })

  const levelHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))

  let battery: any = null

  async function start() {
    if (!('getBattery' in navigator)) {
      sensorData.value.error = '浏览器不支持Battery API'
      return
    }

    try {
      battery = await (navigator as any).getBattery()
      updateBatteryInfo()

      battery.addEventListener('levelchange', updateBatteryInfo)
      battery.addEventListener('chargingchange', updateBatteryInfo)
      battery.addEventListener('chargingtimechange', updateBatteryInfo)
      battery.addEventListener('dischargingtimechange', updateBatteryInfo)

      sensorData.value.status = 'available'
    }
    catch {
      sensorData.value.status = 'error'
      sensorData.value.error = '无法获取电池信息'
    }
  }

  function updateBatteryInfo() {
    if (battery) {
      const level = battery.level * 100
      levelHistory.value.push(level)
      if (levelHistory.value.length > MAX_HISTORY_POINTS)
        levelHistory.value.shift()

      sensorData.value.value = {
        level: `${level.toFixed(0)}%`,
        charging: battery.charging ? '充电中' : '未充电',
        chargingTime: battery.chargingTime === Infinity ? '∞' : `${battery.chargingTime}s`,
        dischargingTime: battery.dischargingTime === Infinity ? '∞' : `${battery.dischargingTime}s`,
      }
      ;(sensorData.value as any).levelHistory = levelHistory.value
      sensorData.value.lastUpdate = Date.now()
    }
  }

  function stop() {
    if (battery) {
      battery.removeEventListener('levelchange', updateBatteryInfo)
      battery.removeEventListener('chargingchange', updateBatteryInfo)
      battery.removeEventListener('chargingtimechange', updateBatteryInfo)
      battery.removeEventListener('dischargingtimechange', updateBatteryInfo)
      battery = null
    }
  }

  return {
    sensorData,
    start,
    stop,
  }
}
