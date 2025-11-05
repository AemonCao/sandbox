import { useElementSize, useWindowSize } from '@vueuse/core'
import * as echarts from 'echarts'

export default function useECharts(
  chartRef: Ref<HTMLElement | null>,
  options: Ref<echarts.EChartsCoreOption>,
) {
  const { width, height } = useWindowSize()
  const { width: chartWidth, height: chartHeight } = useElementSize(chartRef)

  // 图表实例
  // const chart = ref<echarts.ECharts | null>(null)
  // 使用shallowRef https://github.com/apache/echarts/issues/16642#issuecomment-1062441888
  // 或者不对其进行 ref 包装
  let chart: echarts.ECharts | null = null

  // 监听窗口变化，大小变化时，重新渲染图表
  watch([width, height, chartWidth, chartHeight], ([width, height, chartWidth, chartHeight]) => {
    if (!chartRef.value || width === 0 || height === 0 || chartWidth === 0 || chartHeight === 0)
      return
    if (chart)
      chart.resize()
  })

  // 监听图表配置项变化，重新渲染图表
  watch(options, (options) => {
    if (!chartRef.value)
      return
    if (chart)
      chart.setOption(options)
  })

  // 监听主题变化，重新渲染图表
  watch(isDark, (_isDark) => {
    if (!chartRef.value)
      return
    if (chart) {
      chart.dispose()
      initChart()
    }
  })

  function initChart() {
    if (!chartRef.value)
      return
    // 初始化图表
    chart = echarts.init(chartRef.value, isDark.value ? 'dark' : 'light')
    // 设置图表配置项
    chart.setOption(options.value)
  }

  onMounted(() => {
    if (!chartRef.value)
      return
    initChart()
  })

  onUnmounted(() => {
    // 销毁图表
    if (chart)
      chart.dispose()
  })

  return { chart, initChart }
}
