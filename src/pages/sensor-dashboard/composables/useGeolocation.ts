import type { SensorData } from './types'

export function useGeolocation() {
  const sensorData = ref<SensorData>({
    id: 'geolocation',
    name: '地理位置',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
    chartFields: ['accuracy'],
  })

  const MAX_HISTORY = 500
  const accuracyHistory = ref<number[]>([])

  let watchId: number | null = null

  async function checkPermission() {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        sensorData.value.permission = result.state
        sensorData.value.supportsPermissionAPI = true
        result.addEventListener('change', () => {
          sensorData.value.permission = result.state
          if (result.state === 'granted') {
            start()
          }
        })
      }
      catch (error) {
        console.error('Permission API error:', error)
      }
    }
  }

  function start() {
    if (!('geolocation' in navigator)) {
      sensorData.value.status = 'unavailable'
      sensorData.value.error = '浏览器不支持地理位置API'
      return
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy

        accuracyHistory.value.push(accuracy)
        if (accuracyHistory.value.length > MAX_HISTORY)
          accuracyHistory.value.shift()

        sensorData.value.status = 'available'
        sensorData.value.value = {
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracy: `${accuracy.toFixed(0)}m`,
        }
        ;(sensorData.value as any).accuracyHistory = accuracyHistory.value
        sensorData.value.lastUpdate = Date.now()
        sensorData.value.error = undefined
      },
      (error) => {
        sensorData.value.status = 'error'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            sensorData.value.error = '用户拒绝了地理位置权限'
            sensorData.value.status = 'permission-needed'
            break
          case error.POSITION_UNAVAILABLE:
            sensorData.value.error = '位置信息不可用'
            break
          case error.TIMEOUT:
            sensorData.value.error = '获取位置超时'
            break
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    )
  }

  function stop() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  async function requestPermission() {
    start()
  }

  onMounted(() => {
    checkPermission()
  })

  return {
    sensorData,
    start,
    stop,
    requestPermission,
  }
}
