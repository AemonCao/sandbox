<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, ref } from 'vue'

interface Props {
  comparisonResults: any
  accuracyMetrics: any
  selectedAlgorithm: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'algorithm-change': [algorithm: string]
}>()

const chartRef = ref<HTMLDivElement>()
const currentView = ref<'overview' | 'detailed' | 'charts'>('overview')

// 计算属性
const bestAlgorithm = computed(() => {
  if (!props.comparisonResults)
    return null
  return props.comparisonResults.bestAccuracy
})

const algorithmRanks = computed(() => {
  if (!props.accuracyMetrics)
    return []
  return props.accuracyMetrics.map((metric: any, index: number) => ({
    ...metric,
    rank: index + 1,
  }))
})

const performanceInsights = computed(() => {
  if (!props.comparisonResults)
    return []

  const insights: string[] = []
  const algorithms = props.comparisonResults.algorithms

  // 精度分析
  const bestAccuracy = bestAlgorithm.value?.error || Infinity
  const worstAccuracy = Math.max(...Object.values(algorithms).map((alg: any) => alg.averageError))

  if (bestAccuracy < 2) {
    insights.push(`🎯 最佳算法精度达到 ${bestAccuracy.toFixed(2)}m，表现优秀`)
  }
  else if (bestAccuracy < 5) {
    insights.push(`📊 最佳算法精度为 ${bestAccuracy.toFixed(2)}m，表现良好`)
  }
  else {
    insights.push(`⚠️ 最佳算法精度仅为 ${bestAccuracy.toFixed(2)}m，需要优化`)
  }

  // 一致性分析
  const standardDeviations = Object.values(algorithms).map((alg: any) => alg.standardDeviation)
  const avgStdDev = standardDeviations.reduce((sum: number, std: number) => sum + std, 0) / standardDeviations.length

  if (avgStdDev < 1) {
    insights.push('📈 算法表现稳定，标准差较小')
  }
  else if (avgStdDev < 3) {
    insights.push('📉 算法表现中等稳定，存在一定波动')
  }
  else {
    insights.push('🔴 算法表现不稳定，标准差较大')
  }

  // 成功率分析
  const successRates = Object.values(algorithms).map((alg: any) => alg.successRate)
  const avgSuccessRate = successRates.reduce((sum: number, rate: number) => sum + rate, 0) / successRates.length

  if (avgSuccessRate > 95) {
    insights.push('✅ 算法成功率很高，定位可靠性优秀')
  }
  else if (avgSuccessRate > 85) {
    insights.push('⚡ 算法成功率良好，大部分情况可靠')
  }
  else {
    insights.push('❌ 算法成功率偏低，需要改进')
  }

  return insights
})

// 算法颜色配置
const algorithmColors = {
  trilateration: '#8b5cf6',
  fingerprinting: '#f59e0b',
  centroid: '#ec4899',
  weightedCentroid: '#06b6d4',
  kalmanFilter: '#84cc16',
  particleFilter: '#f97316',
}

// 方法
function initCharts() {
  if (!chartRef.value || !props.comparisonResults)
    return

  const chart = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '算法性能对比',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data
        return `${data.name}<br/>
                平均误差: ${data.value[1].toFixed(2)}m<br/>
                计算时间: ${data.value[0].toFixed(2)}ms<br/>
                成功率: ${data.successRate?.toFixed(1)}%`
      },
    },
    legend: {
      bottom: 0,
    },
    xAxis: {
      type: 'value',
      name: '计算时间 (ms)',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: '平均误差 (m)',
      nameLocation: 'middle',
      nameGap: 40,
    },
    series: Object.entries(props.comparisonResults.algorithms).map(([algorithm, metrics]: [string, any]) => ({
      name: metrics.name || algorithm,
      type: 'scatter',
      symbolSize: (data: any) => Math.max(10, Math.min(30, data[2] / 2)),
      itemStyle: {
        color: algorithmColors[algorithm as keyof typeof algorithmColors] || '#666',
      },
      data: [[
        metrics.averageTime,
        metrics.averageError,
        metrics.successRate,
        metrics.successRate,
      ]],
    })),
  }

  chart.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

function getPerformanceGrade(error: number): { grade: string, color: string } {
  if (error < 1)
    return { grade: 'A+', color: 'text-green-600' }
  if (error < 2)
    return { grade: 'A', color: 'text-green-600' }
  if (error < 3)
    return { grade: 'B', color: 'text-blue-600' }
  if (error < 5)
    return { grade: 'C', color: 'text-yellow-600' }
  if (error < 8)
    return { grade: 'D', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

function getSuccessRateColor(rate: number): string {
  if (rate > 95)
    return 'text-green-600'
  if (rate > 85)
    return 'text-blue-600'
  if (rate > 70)
    return 'text-yellow-600'
  return 'text-red-600'
}

// 生命周期
// import { nextTick, watch } from 'vue'
//
// watch(() => props.comparisonResults, () => {
//   if (currentView.value === 'charts') {
//     nextTick(() => {
//       initCharts()
//     })
//   }
// }, { deep: true })
</script>

<template>
  <div class="border border-gray-200 rounded-lg bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <!-- 标题栏 -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-lg text-gray-900 font-semibold dark:text-white">
          算法对比结果
        </h3>

        <!-- 视图切换 -->
        <div class="p-1 rounded-lg bg-gray-100 flex dark:bg-gray-700">
          <button
            v-for="view in ['overview', 'detailed', 'charts']"
            :key="view"
            class="text-sm font-medium px-3 py-1 rounded transition-colors" :class="[
              currentView === view
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
            ]"
            @click="currentView = view"
          >
            {{ view === 'overview' ? '概览' : view === 'detailed' ? '详细' : '图表' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-4">
      <!-- 概览视图 -->
      <div v-if="currentView === 'overview'">
        <!-- 最佳算法卡片 -->
        <div v-if="bestAlgorithm" class="mb-4 p-4 rounded-lg from-blue-50 to-indigo-50 bg-gradient-to-r dark:from-blue-900/20 dark:to-indigo-900/20">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                最佳精度算法
              </div>
              <div class="text-xl text-gray-900 font-bold dark:text-white">
                {{ comparisonResults.algorithms[bestAlgorithm.algorithm]?.name || bestAlgorithm.algorithm }}
              </div>
              <div class="text-lg text-blue-600 dark:text-blue-400">
                {{ bestAlgorithm.error.toFixed(2) }}m
              </div>
            </div>
            <div class="text-4xl">
              🏆
            </div>
          </div>
        </div>

        <!-- 算法排名 -->
        <div class="space-y-2">
          <div
            v-for="(item, index) in algorithmRanks.slice(0, 3)"
            :key="item.algorithm"
            class="p-3 border rounded-lg flex items-center justify-between" :class="[
              index === 0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
              : index === 1 ? 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700'
                : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
            ]"
          >
            <div class="flex items-center space-x-3">
              <!-- 排名 -->
              <div
                class="text-sm font-bold rounded-full flex h-8 w-8 items-center justify-center" :class="[
                  index === 0 ? 'bg-yellow-500 text-white'
                  : index === 1 ? 'bg-gray-500 text-white'
                    : 'bg-orange-500 text-white',
                ]"
              >
                {{ item.rank }}
              </div>

              <!-- 算法信息 -->
              <div>
                <div class="text-gray-900 font-medium dark:text-white">
                  {{ item.name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  平均误差: {{ item.averageError.toFixed(2) }}m
                </div>
              </div>
            </div>

            <!-- 性能指标 -->
            <div class="text-right">
              <div :class="getPerformanceGrade(item.averageError).color" class="text-lg font-bold">
                {{ getPerformanceGrade(item.averageError).grade }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ item.successRate.toFixed(1) }}% 成功率
              </div>
            </div>
          </div>
        </div>

        <!-- 性能洞察 -->
        <div class="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div class="text-sm text-blue-900 font-medium mb-2 dark:text-blue-200">
            💡 性能洞察
          </div>
          <div class="text-xs text-blue-800 space-y-1 dark:text-blue-300">
            <div v-for="(insight, index) in performanceInsights" :key="index">
              {{ insight }}
            </div>
          </div>
        </div>
      </div>

      <!-- 详细视图 -->
      <div v-if="currentView === 'detailed'" class="space-y-3">
        <div
          v-for="item in algorithmRanks"
          :key="item.algorithm"
          class="border border-gray-200 rounded-lg dark:border-gray-600"
        >
          <div class="p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="rounded-full h-4 w-4"
                  :style="{ backgroundColor: algorithmColors[item.algorithm as keyof typeof algorithmColors] }"
                />
                <div>
                  <div class="text-gray-900 font-medium dark:text-white">
                    {{ item.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    排名 #{{ item.rank }}
                  </div>
                </div>
              </div>

              <button
                class="text-xs font-medium px-3 py-1 rounded transition-colors" :class="[
                  selectedAlgorithm === item.algorithm
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300',
                ]"
                @click="emit('algorithm-change', item.algorithm)"
              >
                {{ selectedAlgorithm === item.algorithm ? '当前选择' : '查看详情' }}
              </button>
            </div>

            <!-- 性能指标网格 -->
            <div class="text-sm gap-3 grid grid-cols-2">
              <div class="p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                <div class="text-gray-500 dark:text-gray-400">
                  平均误差
                </div>
                <div class="text-gray-900 font-medium dark:text-white">
                  {{ item.averageError.toFixed(2) }}m
                </div>
              </div>
              <div class="p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                <div class="text-gray-500 dark:text-gray-400">
                  最大误差
                </div>
                <div class="text-gray-900 font-medium dark:text-white">
                  {{ item.maxError.toFixed(2) }}m
                </div>
              </div>
              <div class="p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                <div class="text-gray-500 dark:text-gray-400">
                  标准差
                </div>
                <div class="text-gray-900 font-medium dark:text-white">
                  {{ item.standardDeviation.toFixed(2) }}m
                </div>
              </div>
              <div class="p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                <div class="text-gray-500 dark:text-gray-400">
                  计算时间
                </div>
                <div class="text-gray-900 font-medium dark:text-white">
                  {{ item.averageTime.toFixed(2) }}ms
                </div>
              </div>
            </div>

            <!-- 成功率条 -->
            <div class="mt-3">
              <div class="text-sm mb-1 flex items-center justify-between">
                <span class="text-gray-500 dark:text-gray-400">成功率</span>
                <span :class="getSuccessRateColor(item.successRate)" class="font-medium">
                  {{ item.successRate.toFixed(1) }}%
                </span>
              </div>
              <div class="rounded-full bg-gray-200 h-2 w-full dark:bg-gray-700">
                <div
                  class="rounded-full h-2 transition-all duration-300" :class="[
                    item.successRate > 95 ? 'bg-green-500'
                    : item.successRate > 85 ? 'bg-blue-500'
                      : item.successRate > 70 ? 'bg-yellow-500'
                        : 'bg-red-500',
                  ]"
                  :style="{ width: `${item.successRate}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表视图 -->
      <div v-if="currentView === 'charts'">
        <div ref="chartRef" class="h-96 w-full" />

        <!-- 图表说明 -->
        <div class="text-sm text-gray-600 mt-4 dark:text-gray-400">
          <div class="font-medium mb-1">
            图表说明：
          </div>
          <ul class="text-xs space-y-1">
            <li>• 气泡大小代表成功率</li>
            <li>• X轴为计算时间（越少越好）</li>
            <li>• Y轴为平均误差（越少越好）</li>
            <li>• 左下角为最优区域</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
