import type { DeviceType } from './types'

export function useDeviceDetection() {
  const deviceType = ref<DeviceType>('unknown')
  const screenSize = ref({ width: 0, height: 0 })
  const hasTouch = ref(false)

  function detectDevice() {
    const ua = navigator.userAgent.toLowerCase()
    const width = window.innerWidth

    hasTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    screenSize.value = { width: window.innerWidth, height: window.innerHeight }

    if (/tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(ua)) {
      deviceType.value = 'tablet'
    }
    else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
      deviceType.value = 'mobile'
    }
    else if (width < 768) {
      deviceType.value = 'mobile'
    }
    else if (width >= 768 && width < 1024 && hasTouch.value) {
      deviceType.value = 'tablet'
    }
    else {
      deviceType.value = 'desktop'
    }
  }

  onMounted(() => {
    detectDevice()
    window.addEventListener('resize', detectDevice)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', detectDevice)
  })

  const isMobile = computed(() => deviceType.value === 'mobile')
  const isTablet = computed(() => deviceType.value === 'tablet')
  const isDesktop = computed(() => deviceType.value === 'desktop')

  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    hasTouch,
  }
}
