import { MAX_HISTORY_POINTS, SAMPLE_INTERVAL } from './usePostureConfig'

/**
 * 运动传感器 composable
 * 采集设备加速度和方位数据
 */
export function useMotionSensors() {
  let lastMotionUpdateTime = 0
  let lastOrientationUpdateTime = 0

  // 加速度数据
  const acceleration = ref({ x: 0, y: 0, z: 0 })
  const accXHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))
  const accYHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))
  const accZHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))

  // 方位数据
  const orientation = ref({ alpha: 0, beta: 0, gamma: 0 })
  const oriAlphaHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))
  const oriBetaHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))
  const oriGammaHistory = ref<number[]>(Array.from({ length: MAX_HISTORY_POINTS }, () => 0))

  // 状态
  const isSupported = ref(false)
  const isPermissionGranted = ref(false)
  const needsPermission = ref(false)
  const error = ref<string | null>(null)

  let motionHandler: ((event: DeviceMotionEvent) => void) | null = null
  let orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null

  /**
   * 请求 iOS 设备运动权限
   */
  async function requestIOSPermission(): Promise<boolean> {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        return permission === 'granted'
      }
      catch (err) {
        console.error('iOS permission error:', err)
        error.value = '权限请求失败'
        return false
      }
    }
    return true
  }

  /**
   * 启动传感器监听
   */
  function start() {
    // 检查 DeviceMotion API 支持
    if ('ondevicemotion' in window) {
      isSupported.value = true

      motionHandler = (event: DeviceMotionEvent) => {
        const now = Date.now()
        if (now - lastMotionUpdateTime < SAMPLE_INTERVAL)
          return
        lastMotionUpdateTime = now

        // 处理加速度数据（使用包含重力的加速度）
        if (event.accelerationIncludingGravity) {
          const x = event.accelerationIncludingGravity.x || 0
          const y = event.accelerationIncludingGravity.y || 0
          const z = event.accelerationIncludingGravity.z || 0

          acceleration.value = { x, y, z }

          // 更新历史数据
          accXHistory.value.push(x)
          accYHistory.value.push(y)
          accZHistory.value.push(z)
          if (accXHistory.value.length > MAX_HISTORY_POINTS) {
            accXHistory.value.shift()
            accYHistory.value.shift()
            accZHistory.value.shift()
          }
        }
      }
      window.addEventListener('devicemotion', motionHandler)
    }
    else {
      error.value = '浏览器不支持 DeviceMotion API'
    }

    // 检查 DeviceOrientation API 支持
    if ('ondeviceorientation' in window) {
      orientationHandler = (event: DeviceOrientationEvent) => {
        const now = Date.now()
        if (now - lastOrientationUpdateTime < SAMPLE_INTERVAL)
          return
        lastOrientationUpdateTime = now

        // 处理方位数据
        if (event.alpha !== null) {
          const alpha = event.alpha
          const beta = event.beta || 0
          const gamma = event.gamma || 0

          orientation.value = { alpha, beta, gamma }

          // 更新历史数据
          oriAlphaHistory.value.push(alpha)
          oriBetaHistory.value.push(beta)
          oriGammaHistory.value.push(gamma)
          if (oriAlphaHistory.value.length > MAX_HISTORY_POINTS) {
            oriAlphaHistory.value.shift()
            oriBetaHistory.value.shift()
            oriGammaHistory.value.shift()
          }
        }
      }
      window.addEventListener('deviceorientation', orientationHandler)
    }
    else {
      error.value = '浏览器不支持 DeviceOrientation API'
    }
  }

  /**
   * 停止传感器监听
   */
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

  /**
   * 请求权限并启动
   */
  async function requestPermission() {
    const granted = await requestIOSPermission()
    isPermissionGranted.value = granted
    if (granted) {
      start()
    }
    else {
      needsPermission.value = true
      error.value = '需要设备运动权限'
    }
  }

  return {
    // 数据
    acceleration,
    orientation,
    accXHistory,
    accYHistory,
    accZHistory,
    oriAlphaHistory,
    oriBetaHistory,
    oriGammaHistory,

    // 状态
    isSupported,
    isPermissionGranted,
    needsPermission,
    error,

    // 方法
    start,
    stop,
    requestPermission,
  }
}
