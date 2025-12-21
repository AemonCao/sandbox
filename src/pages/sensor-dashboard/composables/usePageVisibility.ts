import type { SensorData } from './types'

export function usePageVisibility() {
  const sensorData = ref<SensorData>({
    id: 'page-visibility',
    name: '页面可见性',
    status: 'available',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: false,
  })

  function updateVisibility() {
    sensorData.value.value = {
      state: document.visibilityState === 'visible' ? '可见' : '隐藏',
      hidden: document.hidden ? '是' : '否',
    }
    sensorData.value.lastUpdate = Date.now()
  }

  function start() {
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
  }

  function stop() {
    document.removeEventListener('visibilitychange', updateVisibility)
  }

  return {
    sensorData,
    start,
    stop,
  }
}
