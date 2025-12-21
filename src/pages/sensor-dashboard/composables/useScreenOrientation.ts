import type { SensorData } from './types'

export function useScreenOrientation() {
  const sensorData = ref<SensorData>({
    id: 'screen-orientation',
    name: '屏幕方向',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function updateOrientation() {
    if (screen.orientation) {
      sensorData.value.status = 'available'
      sensorData.value.value = {
        type: screen.orientation.type,
        angle: `${screen.orientation.angle}°`,
      }
      sensorData.value.lastUpdate = Date.now()
    }
  }

  function start() {
    if (!screen.orientation) {
      sensorData.value.error = '浏览器不支持Screen Orientation API'
      return
    }

    updateOrientation()
    screen.orientation.addEventListener('change', updateOrientation)
  }

  function stop() {
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', updateOrientation)
    }
  }

  return {
    sensorData,
    start,
    stop,
  }
}
