<script setup lang="ts">
import type { BarChartData, BarStyle, ChartConfig, ChartType, LineChartData, TimelineData, WaterfallData } from './composables/types'
import ChartControls from './components/ChartControls.vue'
import ChartDisplay from './components/ChartDisplay.vue'
import { useAsciiChart } from './composables/useAsciiChart'
import { useResponsive } from './composables/useResponsive'

const { isMobile, chartSize, customSize, setCustomSize, resetToResponsive } = useResponsive()

// 初始配置
const initialConfig: ChartConfig = {
  type: 'line',
  style: {
    width: chartSize.value.width,
    height: chartSize.value.height,
    showAxis: true,
    showGrid: true,
    showHorizontalGrid: true,
    showVerticalGrid: true,
  },
  data: {
    series: [{
      name: 'Series 1',
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 25 },
        { x: 2, y: 15 },
        { x: 3, y: 30 },
        { x: 4, y: 20 },
        { x: 5, y: 35 },
        { x: 6, y: 28 },
      ],
      symbol: '◉',
    }],
  } as LineChartData,
}

const { config, renderedChart, updateConfig, updateStyle, updateData } = useAsciiChart(initialConfig)

const fontFamily = ref('Courier New, monospace')

/**
 * 监听尺寸变化，自动更新图表配置
 */
watch(chartSize, (newSize) => {
  updateStyle({
    width: newSize.width,
    height: newSize.height,
  })
})

/**
 * 切换图表类型
 */
function handleTypeChange(type: ChartType) {
  updateConfig({
    type,
    data: generateSampleData(type),
  })
}

/**
 * 生成示例数据
 */
function generateSampleData(type: ChartType): ChartConfig['data'] {
  switch (type) {
    case 'line':
      return {
        series: [{
          name: 'Series 1',
          data: Array.from({ length: 8 }, (_, i) => ({
            x: i,
            y: Math.floor(Math.random() * 40) + 10,
          })),
          symbol: '◉',
        }],
      } as LineChartData

    case 'bar':
      return {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)),
        barChar: '█',
        barStyle: 'solid',
      } as BarChartData

    case 'timeline':
      return {
        tasks: Array.from({ length: Math.floor(Math.random() * 3) + 4 }, (_, i) => {
          const start = Math.floor(Math.random() * 400)
          const duration = Math.floor(Math.random() * 200) + 50
          return {
            name: `Task ${i + 1}`,
            start,
            end: start + duration,
          }
        }).sort((a, b) => a.start - b.start),
        totalTime: 600,
      } as TimelineData

    case 'waterfall': {
      const stageNames = ['DNS Lookup', 'TCP Connect', 'Request', 'Response', 'Download']
      const types: Array<'blocking' | 'loading'> = ['blocking', 'blocking', 'loading', 'loading', 'loading']
      let currentStart = 0
      const stages = stageNames.map((name, i) => {
        const duration = Math.floor(Math.random() * 150) + 50
        const stage = { name, start: currentStart, duration, type: types[i] }
        currentStart += duration
        return stage
      })
      return {
        stages,
        totalDuration: currentStart,
      } as WaterfallData
    }

    default:
      return initialConfig.data
  }
}

/**
 * 随机生成数据
 */
function randomizeData() {
  const newData = generateSampleData(config.value.type)
  // 保留柱状图样式
  if (config.value.type === 'bar' && 'barStyle' in config.value.data) {
    (newData as BarChartData).barStyle = (config.value.data as BarChartData).barStyle
  }
  updateData(newData)
}

/**
 * 更新柱状图样式
 */
function updateBarStyle(barStyle: BarStyle) {
  if (config.value.type === 'bar') {
    updateData({
      ...(config.value.data as BarChartData),
      barStyle,
    })
  }
}
</script>

<template>
  <div p-4 min-h-screen from-gray-50 to-gray-100 bg-gradient-to-br dark:from-gray-900 dark:to-gray-800>
    <div mx-auto max-w-7xl>
      <h1 text-2xl text-gray-800 font-bold mb-6 text-center md:text-3xl dark:text-gray-100>
        ASCII 字符图表渲染引擎
      </h1>
      <div gap-4 grid grid-cols-1 md:gap-6 lg:grid-cols-3>
        <!-- 控制面板 -->
        <div lg:col-span-1>
          <ChartControls
            :config="config"
            :is-mobile="isMobile"
            :font-family="fontFamily"
            :custom-size="customSize"
            @update:type="handleTypeChange"
            @update:show-axis="updateStyle({ showAxis: $event })"
            @update:show-grid="updateStyle({ showGrid: $event })"
            @update:show-horizontal-grid="updateStyle({ showHorizontalGrid: $event })"
            @update:show-vertical-grid="updateStyle({ showVerticalGrid: $event })"
            @update:grid-style="updateStyle({ gridStyle: $event })"
            @update:bar-style="updateBarStyle"
            @update:font-family="fontFamily = $event"
            @update:custom-size="setCustomSize"
            @reset-size="resetToResponsive"
            @randomize="randomizeData"
          />
        </div>

        <!-- 图表显示 -->
        <div lg:col-span-2>
          <ChartDisplay :lines="renderedChart" :font-family="fontFamily" />
        </div>
      </div>

      <!-- 说明文字 -->
      <div dark="bg-blue-900/20" text-sm text-gray-700 mt-6 p-4 rounded-lg bg-blue-50 dark:text-gray-300>
        <h3 font-bold mb-2>
          功能说明
        </h3>
        <ul list-disc list-inside space-y-1>
          <li>支持 4 种图表类型：折线图、柱状图、时间轴、瀑布图</li>
          <li>数据变化时自动重新渲染</li>
          <li>移动端自适应布局（图表尺寸自动调整）</li>
          <li>使用纯 ASCII 字符绘制，兼容性好</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: 'ASCII 字符图表'
  description: '纯文本字符渲染的数据可视化图表引擎'
  tags: ['可视化', '图表', 'ASCII', '字符']
</route>
