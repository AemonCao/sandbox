import type { SensorData } from './types'

export function useBluetooth() {
  const sensorData = ref<SensorData>({
    id: 'bluetooth',
    name: '蓝牙',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function start() {
    if (!('bluetooth' in navigator)) {
      sensorData.value.error = '浏览器不支持Web Bluetooth API'
      return
    }

    sensorData.value.status = 'permission-needed'
    sensorData.value.value = { available: true }
    sensorData.value.lastUpdate = Date.now()
  }

  async function requestPermission() {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      })
      sensorData.value.status = 'available'
      sensorData.value.value = { deviceName: device.name || '未知设备' }
      sensorData.value.lastUpdate = Date.now()
    }
    catch (error: any) {
      sensorData.value.status = 'permission-needed'
      sensorData.value.error = error.name === 'NotFoundError' ? '未找到蓝牙设备' : '用户取消了蓝牙权限'
    }
  }

  return {
    sensorData,
    start,
    requestPermission,
  }
}
