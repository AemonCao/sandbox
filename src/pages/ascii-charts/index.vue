<script setup lang="ts">
import type { BarChartData, BarStyle, ChartConfig, ChartType, LineChartData, NodeStyle, PieChartData, TimelineData, TreeChartData, TreeDirection, TreeNode, WaterfallData } from './composables/types'
import ChartControls from './components/ChartControls.vue'
import ChartDisplay from './components/ChartDisplay.vue'
import { useAsciiChart } from './composables/useAsciiChart'
import { preloadGoogleFonts } from './composables/useFonts'
import { useResponsive } from './composables/useResponsive'

// 预加载 Google Fonts
onMounted(() => {
  preloadGoogleFonts()
})

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
    showBorder: false,
    borderStyle: 'thin',
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

    case 'pie': {
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
      const count = Math.floor(Math.random() * 9) + 2 // 2-10个项目
      return {
        slices: Array.from({ length: count }, (_, i) => ({
          label: labels[i],
          value: Math.floor(Math.random() * 50) + 20,
        })),
      } as PieChartData
    }

    case 'tree': {
      const currentDepth = (config.value.data as TreeChartData).depth
      const depth = currentDepth ?? Math.floor(Math.random() * 2) + 2
      const useRandomLabel = (config.value.data as TreeChartData).randomLabel === true

      function generateRandomLabel(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const len = Math.floor(Math.random() * 8) + 2
        return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      }

      function generateNode(id: string, level: number, maxLevel: number): TreeNode {
        const label = useRandomLabel ? generateRandomLabel() : id
        const node: TreeNode = { id, label }
        if (level < maxLevel) {
          const childCount = Math.floor(Math.random() * 3) + 1
          node.children = Array.from({ length: childCount }, (_, i) =>
            generateNode(`${id}.${i + 1}`, level + 1, maxLevel))
        }
        return node
      }

      const root = generateNode('Root', 0, depth)

      return {
        root,
        direction: 'top-down',
        nodeStyle: {
          borderStyle: 'thin',
          showBorder: true,
          width: 8,
          height: 3,
        },
        randomLabel: useRandomLabel,
        depth,
      } as TreeChartData
    }

    default:
      return initialConfig.data
  }
}

/**
 * 随机生成数据
 */
function randomizeData() {
  const currentData = config.value.data
  const newData = generateSampleData(config.value.type)

  // 树图特殊处理：只更新 root 节点，保留其他配置
  if (config.value.type === 'tree') {
    updateData({
      ...currentData,
      root: (newData as TreeChartData).root,
    })
  }
  else {
    // 合并配置，保留所有现有配置项
    updateData({ ...currentData, ...newData })
  }
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

/**
 * 更新饼图标签样式
 */
function updatePieLabelStyle(labelStyle: string) {
  if (config.value.type === 'pie') {
    updateData({
      ...(config.value.data as PieChartData),
      labelStyle: labelStyle as any,
    })
  }
}

/**
 * 更新饼图图例位置
 */
function updateLegendPosition(position: string) {
  if (config.value.type === 'pie') {
    updateData({
      ...(config.value.data as PieChartData),
      legendPosition: position as any,
    })
  }
}

/**
 * 更新饼图图例方向
 */
function updateLegendOrientation(orientation: string) {
  if (config.value.type === 'pie') {
    updateData({
      ...(config.value.data as PieChartData),
      legendOrientation: orientation as any,
    })
  }
}

/**
 * 更新树图方向
 */
function updateTreeDirection(direction: TreeDirection) {
  if (config.value.type === 'tree') {
    updateData({
      ...(config.value.data as TreeChartData),
      direction,
    })
  }
}

/**
 * 更新节点样式
 */
function updateNodeStyle(nodeStyle: NodeStyle) {
  if (config.value.type === 'tree') {
    updateData({
      ...(config.value.data as TreeChartData),
      nodeStyle: {
        ...(config.value.data as TreeChartData).nodeStyle,
        ...nodeStyle,
      },
    })
  }
}

/**
 * 更新树图间距
 */
function updateTreeSpacing(spacing: { siblingSpacing?: number, levelSpacing?: number, randomLabel?: boolean, depth?: number }) {
  if (config.value.type === 'tree') {
    const currentData = config.value.data as TreeChartData
    updateData({
      ...currentData,
      ...spacing,
    })
    // 如果切换了 randomLabel 或 depth，重新生成数据
    if ((spacing.randomLabel !== undefined && spacing.randomLabel !== currentData.randomLabel)
      || (spacing.depth !== undefined && spacing.depth !== currentData.depth)) {
      const newData = generateSampleData('tree') as TreeChartData
      updateData({
        ...currentData,
        ...spacing,
        root: newData.root,
      })
    }
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
            @update:show-border="updateStyle({ showBorder: $event })"
            @update:border-style="updateStyle({ borderStyle: $event })"
            @update:bar-style="updateBarStyle"
            @update:pie-label-style="updatePieLabelStyle"
            @update:legend-position="updateLegendPosition"
            @update:legend-orientation="updateLegendOrientation"
            @update:tree-direction="updateTreeDirection"
            @update:node-style="updateNodeStyle"
            @update:tree-spacing="updateTreeSpacing"
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
          <li>支持 6 种图表类型：折线图、柱状图、时间轴、瀑布图、饼图、树状图</li>
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
