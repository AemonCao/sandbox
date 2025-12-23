/**
 * 响应式布局工具
 * 根据屏幕尺寸自动调整图表大小
 */

export interface ResponsiveConfig {
  mobile: { width: number, height: number }
  tablet: { width: number, height: number }
  desktop: { width: number, height: number }
}

const defaultConfig: ResponsiveConfig = {
  mobile: { width: 50, height: 20 },
  tablet: { width: 70, height: 25 },
  desktop: { width: 90, height: 30 },
}

export function useResponsive(config: ResponsiveConfig = defaultConfig) {
  const screenWidth = ref(window.innerWidth)
  const customSize = ref<{ width: number, height: number } | null>(null)

  /**
   * 更新屏幕宽度
   */
  function updateScreenWidth() {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateScreenWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
  })

  const isMobile = computed(() => screenWidth.value < 768)
  const isTablet = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
  const isDesktop = computed(() => screenWidth.value >= 1024)

  /**
   * 根据设备类型返回合适的图表尺寸
   */
  const chartSize = computed(() => {
    if (customSize.value)
      return customSize.value

    if (isMobile.value)
      return config.mobile
    else if (isTablet.value)
      return config.tablet
    else
      return config.desktop
  })

  /**
   * 设置自定义尺寸
   */
  function setCustomSize(width: number, height: number) {
    customSize.value = { width, height }
  }

  /**
   * 重置为响应式尺寸
   */
  function resetToResponsive() {
    customSize.value = null
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    chartSize,
    screenWidth,
    customSize: readonly(customSize),
    setCustomSize,
    resetToResponsive,
  }
}
