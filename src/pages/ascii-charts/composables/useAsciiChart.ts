/**
 * ASCII 字符图表渲染引擎
 * 核心渲染逻辑和配置管理
 */
import type { ChartConfig } from './types'
import { renderBarChart } from './renderers/barChart'
import { renderLineChart } from './renderers/lineChart'
import { renderPieChart } from './renderers/pieChart'
import { renderTimelineChart } from './renderers/timelineChart'
import { renderWaterfallChart } from './renderers/waterfallChart'

export function useAsciiChart(initialConfig: ChartConfig) {
  const config = ref<ChartConfig>(initialConfig)

  /**
   * 主渲染函数 - 根据类型分发到对应渲染器
   */
  const renderedChart = computed(() => {
    switch (config.value.type) {
      case 'line':
        return renderLineChart(config.value)
      case 'bar':
        return renderBarChart(config.value)
      case 'timeline':
        return renderTimelineChart(config.value)
      case 'waterfall':
        return renderWaterfallChart(config.value)
      case 'pie':
        return renderPieChart(config.value)
      default:
        return ['Invalid chart type']
    }
  })

  /**
   * 更新配置
   */
  function updateConfig(newConfig: Partial<ChartConfig>) {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * 更新样式
   */
  function updateStyle(newStyle: Partial<ChartConfig['style']>) {
    config.value = {
      ...config.value,
      style: { ...config.value.style, ...newStyle },
    }
  }

  /**
   * 更新数据
   */
  function updateData(newData: ChartConfig['data']) {
    config.value = {
      ...config.value,
      data: newData,
    }
  }

  return {
    config,
    renderedChart,
    updateConfig,
    updateStyle,
    updateData,
  }
}
