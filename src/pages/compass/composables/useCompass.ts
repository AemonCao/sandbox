/**
 * 指南针 composable
 * 采集设备方位数据用于指南针显示
 */
export function useCompass() {
  const heading = ref(0)
  const isSupported = ref(false)
  const isPermissionGranted = ref(false)
  const needsPermission = ref(false)
  const error = ref<string | null>(null)

  let orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null

  /**
   * 请求 iOS 设备方位权限
   */
  async function requestIOSPermission(): Promise<boolean> {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
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
   * 启动指南针监听
   */
  function start() {
    if ('ondeviceorientation' in window) {
      isSupported.value = true

      orientationHandler = (event: DeviceOrientationEvent) => {
        if ((event as any).webkitCompassHeading !== undefined) {
          // iOS: webkitCompassHeading 直接给出指南针方向（0° = 北）
          heading.value = (event as any).webkitCompassHeading
        }
        else if (event.alpha !== null) {
          // Android: alpha 是设备指向的方向（0° = 北，顺时针）
          heading.value = event.alpha
        }
      }

      window.addEventListener('deviceorientation', orientationHandler)
    }
    else {
      error.value = '浏览器不支持 DeviceOrientation API'
    }
  }

  /**
   * 停止指南针监听
   */
  function stop() {
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
      error.value = '需要设备方位权限'
    }
  }

  return {
    heading,
    isSupported,
    isPermissionGranted,
    needsPermission,
    error,
    start,
    stop,
    requestPermission,
  }
}
