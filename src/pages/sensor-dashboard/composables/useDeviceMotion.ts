import type { SensorData } from './types'

export function useDeviceMotion() {
  const accelerometer = ref<SensorData>({
    id: 'accelerometer',
    name: '加速度计',
    status: 'unavailable',
    value: null,
    unit: 'm/s²',
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  const gyroscope = ref<SensorData>({
    id: 'gyroscope',
    name: '陀螺仪',
    status: 'unavailable',
    value: null,
    unit: '°/s',
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  const magnetometer = ref<SensorData>({
    id: 'magnetometer',
    name: '磁力计',
    status: 'unavailable',
    value: null,
    unit: 'μT',
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  const orientation = ref<SensorData>({
    id: 'orientation',
    name: '设备方向',
    status: 'unavailable',
    value: null,
    unit: '°',
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  let motionHandler: ((event: DeviceMotionEvent) => void) | null = null
  let orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null

  async function requestIOSPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        return permission === 'granted'
      }
      catch (error) {
        console.error('iOS permission error:', error)
        return false
      }
    }
    return true
  }

  function start() {
    if ('ondevicemotion' in window) {
      motionHandler = (event: DeviceMotionEvent) => {
        if (event.acceleration) {
          accelerometer.value.status = 'available'
          accelerometer.value.value = {
            x: event.acceleration.x?.toFixed(2) || '0',
            y: event.acceleration.y?.toFixed(2) || '0',
            z: event.acceleration.z?.toFixed(2) || '0',
          }
          accelerometer.value.lastUpdate = Date.now()
        }

        if (event.rotationRate) {
          gyroscope.value.status = 'available'
          gyroscope.value.value = {
            alpha: event.rotationRate.alpha?.toFixed(2) || '0',
            beta: event.rotationRate.beta?.toFixed(2) || '0',
            gamma: event.rotationRate.gamma?.toFixed(2) || '0',
          }
          gyroscope.value.lastUpdate = Date.now()
        }
      }
      window.addEventListener('devicemotion', motionHandler)
    }
    else {
      accelerometer.value.error = '浏览器不支持DeviceMotion API'
      gyroscope.value.error = '浏览器不支持DeviceMotion API'
    }

    if ('ondeviceorientation' in window) {
      orientationHandler = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          orientation.value.status = 'available'
          orientation.value.value = {
            alpha: event.alpha.toFixed(1),
            beta: event.beta?.toFixed(1) || '0',
            gamma: event.gamma?.toFixed(1) || '0',
          }
          orientation.value.lastUpdate = Date.now()
        }
      }
      window.addEventListener('deviceorientation', orientationHandler)
    }
    else {
      orientation.value.error = '浏览器不支持DeviceOrientation API'
    }

    magnetometer.value.status = 'unavailable'
    magnetometer.value.error = '浏览器不支持Magnetometer API'
  }

  function stop() {
    if (motionHandler) {
      window.removeEventListener('devicemotion', motionHandler)
      motionHandler = null
    }
    if (orientationHandler) {
      window.removeEventListener('deviceorientation', orientationHandler)
      orientationHandler = null
    }
  }

  async function requestPermission() {
    const granted = await requestIOSPermission()
    if (granted) {
      start()
    }
    else {
      accelerometer.value.status = 'permission-needed'
      gyroscope.value.status = 'permission-needed'
      orientation.value.status = 'permission-needed'
      accelerometer.value.error = '需要设备运动权限'
      gyroscope.value.error = '需要设备运动权限'
      orientation.value.error = '需要设备运动权限'
    }
  }

  return {
    accelerometer,
    gyroscope,
    magnetometer,
    orientation,
    start,
    stop,
    requestPermission,
  }
}
