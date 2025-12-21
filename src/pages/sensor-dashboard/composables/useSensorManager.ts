import type { SensorCategory } from './types'
import { useBattery } from './useBattery'
import { useBluetooth } from './useBluetooth'
import { useDeviceMemory } from './useDeviceMemory'
import { useDeviceMotion } from './useDeviceMotion'
import { useFullscreen } from './useFullscreen'
import { useGeolocation } from './useGeolocation'
import { useHardwareConcurrency } from './useHardwareConcurrency'
import { useMediaDevices } from './useMediaDevices'
import { useNetworkInfo } from './useNetworkInfo'
import { useOnlineStatus } from './useOnlineStatus'
import { usePageVisibility } from './usePageVisibility'
import { useScreenOrientation } from './useScreenOrientation'
import { useStorageQuota } from './useStorageQuota'
import { useVibration } from './useVibration'

export function useSensorManager() {
  const geolocation = useGeolocation()
  const deviceMotion = useDeviceMotion()
  const battery = useBattery()
  const mediaDevices = useMediaDevices()
  const bluetooth = useBluetooth()
  const networkInfo = useNetworkInfo()
  const screenOrientation = useScreenOrientation()
  const onlineStatus = useOnlineStatus()
  const pageVisibility = usePageVisibility()
  const deviceMemory = useDeviceMemory()
  const hardwareConcurrency = useHardwareConcurrency()
  const storageQuota = useStorageQuota()
  const fullscreen = useFullscreen()
  const vibration = useVibration()

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
        onlineStatus.sensorData.value,
      ],
    },
    {
      name: '🖥️ 显示',
      sensors: [
        screenOrientation.sensorData.value,
        pageVisibility.sensorData.value,
        fullscreen.sensorData.value,
      ],
    },
    {
      name: '⚡ 系统',
      sensors: [
        battery.sensorData.value,
        deviceMemory.sensorData.value,
        hardwareConcurrency.sensorData.value,
        storageQuota.sensorData.value,
        vibration.sensorData.value,
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
    screenOrientation.start()
    onlineStatus.start()
    pageVisibility.start()
    deviceMemory.start()
    hardwareConcurrency.start()
    storageQuota.start()
    fullscreen.start()
    vibration.start()
  }

  function stopAll() {
    geolocation.stop()
    deviceMotion.stop()
    battery.stop()
    networkInfo.stop()
    screenOrientation.stop()
    onlineStatus.stop()
    pageVisibility.stop()
    fullscreen.stop()
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
