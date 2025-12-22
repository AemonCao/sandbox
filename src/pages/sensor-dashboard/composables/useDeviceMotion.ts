import type { SensorData } from './types'

export function useDeviceMotion() {
  const HISTORY_DURATION = 10000
  let maxHistory = 600
  let lastTimestamp = 0
  let updateCount = 0

  const accelerometer = ref<SensorData>({
    id: 'accelerometer',
    name: '加速度计',
    status: 'unavailable',
    value: null,
    unit: 'm/s²',
    lastUpdate: 0,
    supportsPermissionAPI: false,
    chartFields: ['x', 'y', 'z'],
    chartMin: -20,
    chartMax: 20,
  })

  const gyroscope = ref<SensorData>({
    id: 'gyroscope',
    name: '陀螺仪',
    status: 'unavailable',
    value: null,
    unit: '°/s',
    lastUpdate: 0,
    supportsPermissionAPI: false,
    chartFields: ['alpha', 'beta', 'gamma'],
    chartMin: -360,
    chartMax: 360,
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
    chartFields: ['alpha', 'beta', 'gamma'],
    chartMin: -180,
    chartMax: 360,
  })

  const accXHistory = ref<number[]>([])
  const accYHistory = ref<number[]>([])
  const accZHistory = ref<number[]>([])
  const gyroAlphaHistory = ref<number[]>([])
  const gyroBetaHistory = ref<number[]>([])
  const gyroGammaHistory = ref<number[]>([])
  const oriAlphaHistory = ref<number[]>([])
  const oriBetaHistory = ref<number[]>([])
  const oriGammaHistory = ref<number[]>([])

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
          const now = Date.now()
          if (lastTimestamp === 0)
            lastTimestamp = now
          updateCount++
          if (now - lastTimestamp >= HISTORY_DURATION) {
            maxHistory = Math.max(100, Math.ceil(updateCount * 1.2))
            lastTimestamp = now
            updateCount = 0
          }

          const x = event.acceleration.x || 0
          const y = event.acceleration.y || 0
          const z = event.acceleration.z || 0

          accXHistory.value.push(x)
          accYHistory.value.push(y)
          accZHistory.value.push(z)
          if (accXHistory.value.length > maxHistory) {
            accXHistory.value.shift()
            accYHistory.value.shift()
            accZHistory.value.shift()
          }

          accelerometer.value.status = 'available'
          accelerometer.value.value = {
            x: x.toFixed(2),
            y: y.toFixed(2),
            z: z.toFixed(2),
          }
          ;(accelerometer.value as any).xHistory = accXHistory.value
          ;(accelerometer.value as any).yHistory = accYHistory.value
          ;(accelerometer.value as any).zHistory = accZHistory.value
          accelerometer.value.lastUpdate = Date.now()
        }

        if (event.rotationRate) {
          const alpha = event.rotationRate.alpha || 0
          const beta = event.rotationRate.beta || 0
          const gamma = event.rotationRate.gamma || 0

          gyroAlphaHistory.value.push(alpha)
          gyroBetaHistory.value.push(beta)
          gyroGammaHistory.value.push(gamma)
          if (gyroAlphaHistory.value.length > maxHistory) {
            gyroAlphaHistory.value.shift()
            gyroBetaHistory.value.shift()
            gyroGammaHistory.value.shift()
          }

          gyroscope.value.status = 'available'
          gyroscope.value.value = {
            alpha: alpha.toFixed(2),
            beta: beta.toFixed(2),
            gamma: gamma.toFixed(2),
          }
          ;(gyroscope.value as any).alphaHistory = gyroAlphaHistory.value
          ;(gyroscope.value as any).betaHistory = gyroBetaHistory.value
          ;(gyroscope.value as any).gammaHistory = gyroGammaHistory.value
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
          const alpha = event.alpha
          const beta = event.beta || 0
          const gamma = event.gamma || 0

          oriAlphaHistory.value.push(alpha)
          oriBetaHistory.value.push(beta)
          oriGammaHistory.value.push(gamma)
          if (oriAlphaHistory.value.length > maxHistory) {
            oriAlphaHistory.value.shift()
            oriBetaHistory.value.shift()
            oriGammaHistory.value.shift()
          }

          orientation.value.status = 'available'
          orientation.value.value = {
            alpha: alpha.toFixed(1),
            beta: beta.toFixed(1),
            gamma: gamma.toFixed(1),
          }
          ;(orientation.value as any).alphaHistory = oriAlphaHistory.value
          ;(orientation.value as any).betaHistory = oriBetaHistory.value
          ;(orientation.value as any).gammaHistory = oriGammaHistory.value
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
