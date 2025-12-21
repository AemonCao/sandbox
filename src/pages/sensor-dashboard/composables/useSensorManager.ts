import type { SensorCategory } from './types'
import { useBattery } from './useBattery'
import { useBluetooth } from './useBluetooth'
import { useDeviceMotion } from './useDeviceMotion'
import { useGeolocation } from './useGeolocation'
import { useMediaDevices } from './useMediaDevices'
import { useNetworkInfo } from './useNetworkInfo'

export function useSensorManager() {
  const geolocation = useGeolocation()
  const deviceMotion = useDeviceMotion()
  const battery = useBattery()
  const mediaDevices = useMediaDevices()
  const bluetooth = useBluetooth()
  const networkInfo = useNetworkInfo()

  const categories = computed<SensorCategory[]>(() => [
    {
      name: '📍 位置',
      sensors: [geolocation.sensorData.value],
    },
    {
      name: '🎯 运动与方向',
      sensors: [
        deviceMotion.accelerometer.value,
        deviceMotion.gyroscope.value,
        deviceMotion.magnetometer.value,
        deviceMotion.orientation.value,
      ],
    },
    {
      name: '📷 媒体设备',
      sensors: [
        mediaDevices.camera.value,
        mediaDevices.microphone.value,
      ],
    },
    {
      name: '🌐 连接性',
      sensors: [
        bluetooth.sensorData.value,
        networkInfo.sensorData.value,
      ],
    },
    {
      name: '⚡ 系统',
      sensors: [
        battery.sensorData.value,
      ],
    },
  ])

  function startAll() {
    geolocation.start()
    deviceMotion.start()
    battery.start()
    mediaDevices.start()
    bluetooth.start()
    networkInfo.start()
  }

  function stopAll() {
    geolocation.stop()
    deviceMotion.stop()
    battery.stop()
    networkInfo.stop()
  }

  function requestPermission(sensorId: string) {
    switch (sensorId) {
      case 'geolocation':
        geolocation.requestPermission()
        break
      case 'accelerometer':
      case 'gyroscope':
      case 'magnetometer':
      case 'orientation':
        deviceMotion.requestPermission()
        break
      case 'camera':
        mediaDevices.requestCameraPermission()
        break
      case 'microphone':
        mediaDevices.requestMicrophonePermission()
        break
      case 'bluetooth':
        bluetooth.requestPermission()
        break
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAll()
      }
      else {
        startAll()
      }
    })
  })

  return {
    categories,
    startAll,
    stopAll,
    requestPermission,
  }
}
