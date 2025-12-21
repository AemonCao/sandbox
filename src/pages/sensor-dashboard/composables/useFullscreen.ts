import type { SensorData } from './types'

export function useFullscreen() {
  const sensorData = ref<SensorData>({
    id: 'fullscreen',
    name: '全屏支持',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function updateFullscreen() {
    sensorData.value.value = {
      enabled: document.fullscreenEnabled ? '支持' : '不支持',
      active: document.fullscreenElement ? '是' : '否',
    }
    sensorData.value.lastUpdate = Date.now()
  }

  function start() {
    if (document.fullscreenEnabled === undefined) {
      sensorData.value.error = '浏览器不支持Fullscreen API'
      return
    }

    sensorData.value.status = 'available'
    updateFullscreen()
    document.addEventListener('fullscreenchange', updateFullscreen)
  }

  function stop() {
    document.removeEventListener('fullscreenchange', updateFullscreen)
  }

  return {
    sensorData,
    start,
    stop,
  }
}
