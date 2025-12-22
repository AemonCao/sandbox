<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AlgorithmCanvas from './components/AlgorithmCanvas.vue'
import AlgorithmPanel from './components/AlgorithmPanel.vue'
import ResultPanel from './components/ResultPanel.vue'
import TestPanel from './components/TestPanel.vue'
import { useAlgorithmComparison } from './composables/useAlgorithmComparison'
import { useTestData } from './composables/useTestData'

// 直接在组件中定义数据（临时解决方案）
const beacons = ref([
  { id: 'beacon1', x: 1, y: 1, txPower: -59, n: 2.0, color: '#ef4444' },
  { id: 'beacon2', x: 10, y: 1, txPower: -59, n: 2.0, color: '#3b82f6' },
  { id: 'beacon3', x: 10, y: 6, txPower: -59, n: 2.0, color: '#10b981' },
  { id: 'beacon4', x: 1, y: 6, txPower: -59, n: 2.0, color: '#f59e0b' },
])

const testPoints = ref([
  {
    id: 'point1',
    x: 3,
    y: 2,
    rssi: {
      beacon1: -65,
      beacon2: -70,
      beacon3: -75,
      beacon4: -80,
    },
  },
  {
    id: 'point2',
    x: 5,
    y: 3,
    rssi: {
      beacon1: -70,
      beacon2: -65,
      beacon3: -70,
      beacon4: -75,
    },
  },
  {
    id: 'point3',
    x: 7,
    y: 4,
    rssi: {
      beacon1: -80,
      beacon2: -75,
      beacon3: -65,
      beacon4: -70,
    },
  },
])

const truePositions = ref([
  { x: 3, y: 2 },
  { x: 5, y: 3 },
  { x: 7, y: 4 },
])

const algorithmResults = ref<Record<string, any>>({})
const selectedAlgorithm = ref('trilateration')
const visualizationMode = ref('overlay')
const showBeaconCoverage = ref(true)
const showTestPaths = ref(false)

/**
 * 清除所有测试数据
 */
function clearData() {
  beacons.value = []
  testPoints.value = []
  truePositions.value = []
  Object.keys(algorithmResults.value).forEach((algorithm) => {
    algorithmResults.value[algorithm] = []
  })
}

/**
 * 加载预设测试场景
 *
 * @param {string} _sceneType 场景类型
 */
function loadPresetData(_sceneType: string) {
  // 临时实现 - 可以根据sceneType加载不同的预设数据
}

// 使用算法对比分析
const {
  algorithmInfo,
  accuracyMetrics,
  comparisonResults,
  isCalculating,
  startComparison,
  generateComparisonReport,
} = useAlgorithmComparison(beacons, testPoints, truePositions, algorithmResults)

// 使用测试数据管理
const {
  testScenarios,
  activeTestScenario,
  isRunningTest,
  testProgress,
  runAutomatedTest,
  stopTest,
  generateRandomTestData,
} = useTestData(beacons, testPoints, truePositions)

// 算法配置
const algorithmConfigs = ref({
  trilateration: {
    enabled: true,
    weight: 1.0,
    noiseReduction: false,
    outlierThreshold: 2.0,
  },
  fingerprinting: {
    enabled: true,
    kNearest: 3,
    signalTolerance: 5,
    interpolationMethod: 'linear',
  },
  centroid: {
    enabled: true,
    minBeacons: 3,
    weightedAverage: true,
    signalPower: 2.0,
  },
  weightedCentroid: {
    enabled: true,
    signalPower: 2.5,
    minSignalStrength: -90,
    maxDistanceRatio: 2.0,
  },
  kalmanFilter: {
    enabled: true,
    processNoise: 0.1,
    measurementNoise: 1.0,
    initialStateEstimate: { x: 0, y: 0 },
  },
  particleFilter: {
    enabled: true,
    particleCount: 100,
    motionNoise: 0.5,
    measurementNoise: 2.0,
    resamplingThreshold: 0.5,
  },
})

// 画布配置
const canvasConfig = ref({
  scale: 50,
  showGrid: true,
  showCoordinates: true,
  backgroundColor: '#ffffff',
})

// 统计数据
const statistics = computed(() => {
  if (!comparisonResults.value)
    return null

  return {
    totalTests: comparisonResults.value.totalTests,
    bestAlgorithm: comparisonResults.value.bestAccuracy?.algorithm,
    averageAccuracy: comparisonResults.value.averageAccuracy,
    standardDeviation: comparisonResults.value.standardDeviation,
  }
})

// 事件处理
/**
 * 处理算法切换事件
 *
 * @param {string} algorithm 算法名称
 */
function handleAlgorithmChange(algorithm: string) {
  selectedAlgorithm.value = algorithm
}

/**
 * 处理可视化模式切换事件
 *
 * @param {string} mode 可视化模式
 */
function handleVisualizationChange(mode: string) {
  visualizationMode.value = mode
}

/**
 * 处理算法配置变更事件
 *
 * @param {string} algorithm 算法名称
 * @param {any} config 配置对象
 */
function handleConfigChange(algorithm: string, config: any) {
  if (algorithm in algorithmConfigs.value) {
    algorithmConfigs.value[algorithm as keyof typeof algorithmConfigs.value] = {
      ...algorithmConfigs.value[algorithm as keyof typeof algorithmConfigs.value],
      ...config,
    }
  }
  // 重新计算算法结果
  startComparison()
}

/**
 * 运行自动化测试
 */
function handleRunTest() {
  runAutomatedTest(activeTestScenario.value)
}

/**
 * 生成并导出对比报告
 */
function handleGenerateReport() {
  const report = generateComparisonReport()
  if (report) {
    // 导出报告
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `algorithm-comparison-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 自动保存功能
/**
 * 保存数据到本地存储
 */
function saveToLocalStorage() {
  const data = {
    beacons: beacons.value,
    testPoints: testPoints.value,
    truePositions: truePositions.value,
    algorithmResults: algorithmResults.value,
    algorithmConfigs: algorithmConfigs.value,
    canvasConfig: canvasConfig.value,
  }
  localStorage.setItem('positioning-algorithms-data', JSON.stringify(data))
}

/**
 * 从本地存储加载数据
 */
function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('positioning-algorithms-data')
    if (savedData) {
      const data = JSON.parse(savedData)

      if (data.beacons)
        beacons.value = data.beacons
      if (data.testPoints)
        testPoints.value = data.testPoints
      if (data.truePositions)
        truePositions.value = data.truePositions
      if (data.algorithmResults)
        algorithmResults.value = data.algorithmResults
      if (data.algorithmConfigs)
        algorithmConfigs.value = data.algorithmConfigs
      if (data.canvasConfig)
        canvasConfig.value = data.canvasConfig
    }
  }
  catch (error) {
    console.error('加载本地数据失败:', error)
  }
}

// 监听数据变化自动保存
watch([beacons, testPoints, truePositions, algorithmResults, algorithmConfigs, canvasConfig], () => {
  saveToLocalStorage()
}, { deep: true })

// 生命周期
onMounted(() => {
  loadFromLocalStorage()
  loadPresetData('default')
  nextTick(() => {
    startComparison()
  })
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen dark:bg-gray-900">
    <!-- 头部导航 -->
    <header class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto px-4 max-w-7xl lg:px-8 sm:px-6">
        <div class="flex h-16 items-center justify-between md:h-20">
          <div class="flex items-center">
            <h1 class="text-5 text-gray-900 font-bold md:text-6 dark:text-white">
              多算法定位引擎对比
            </h1>
            <div class="ml-6 flex items-center space-x-4">
              <div class="text-3.5 text-gray-500 md:text-3.5 dark:text-gray-400">
                测试点: {{ testPoints.length }}
              </div>
              <div class="text-3.5 text-gray-500 md:text-3.5 dark:text-gray-400">
                信标: {{ beacons.length }}
              </div>
              <div v-if="statistics" class="text-3.5 text-gray-500 md:text-3.5 dark:text-gray-400">
                最佳算法: {{ statistics.bestAlgorithm }}
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <!-- 可视化模式切换 -->
            <div class="p-1 rounded-lg bg-gray-100 flex dark:bg-gray-700">
              <button
                v-for="mode in ['overlay', 'comparison', 'accuracy', 'heatmap']"
                :key="mode"
                class="text-3.5 font-medium px-3 py-2 rounded transition-colors md:text-3.5 md:py-1" :class="[
                  visualizationMode === mode
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                ]"
                @click="handleVisualizationChange(mode)"
              >
                {{ mode === 'overlay' ? '叠加' : mode === 'comparison' ? '对比' : mode === 'accuracy' ? '精度' : '热力图' }}
              </button>
            </div>

            <!-- 操作按钮 -->
            <button
              :disabled="isCalculating"
              class="text-white px-4 py-2 rounded-lg bg-blue-600 transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="startComparison"
            >
              {{ isCalculating ? '计算中...' : '重新计算' }}
            </button>

            <button
              class="text-white px-4 py-2 rounded-lg bg-green-600 transition-colors hover:bg-green-700"
              @click="handleGenerateReport"
            >
              生成报告
            </button>

            <button
              class="text-white px-4 py-2 rounded-lg bg-gray-600 transition-colors hover:bg-gray-700"
              @click="clearData"
            >
              清空数据
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto px-4 py-6 max-w-7xl lg:px-8 sm:px-6">
      <div class="gap-6 grid grid-cols-1 lg:grid-cols-3">
        <!-- 左侧画布区域 -->
        <div class="lg:col-span-2">
          <div class="border border-gray-200 rounded-lg bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <h2 class="text-lg text-gray-900 font-semibold dark:text-white">
                  算法可视化
                </h2>

                <!-- 显示控制 -->
                <div class="flex items-center space-x-3">
                  <label class="text-sm flex items-center space-x-2">
                    <input
                      v-model="showBeaconCoverage"
                      type="checkbox"
                      class="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    >
                    <span class="text-gray-700 dark:text-gray-300">覆盖范围</span>
                  </label>

                  <label class="text-sm flex items-center space-x-2">
                    <input
                      v-model="showTestPaths"
                      type="checkbox"
                      class="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    >
                    <span class="text-gray-700 dark:text-gray-300">测试路径</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="p-4">
              <AlgorithmCanvas
                :beacons="beacons"
                :test-points="testPoints"
                :true-positions="truePositions"
                :algorithm-results="algorithmResults"
                :selected-algorithm="selectedAlgorithm"
                :visualization-mode="visualizationMode"
                :show-beacon-coverage="showBeaconCoverage"
                :show-test-paths="showTestPaths"
                :config="canvasConfig"
                :algorithm-configs="algorithmConfigs"
                @algorithm-change="handleAlgorithmChange"
                @config-change="handleConfigChange"
              />
            </div>
          </div>

          <!-- 算法对比结果 -->
          <div v-if="comparisonResults" class="mt-6 border border-gray-200 rounded-lg bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg text-gray-900 font-semibold dark:text-white">
                算法对比结果
              </h2>
            </div>

            <div class="p-4">
              <ResultPanel
                :comparison-results="comparisonResults"
                :accuracy-metrics="accuracyMetrics"
                :selected-algorithm="selectedAlgorithm"
                @algorithm-change="handleAlgorithmChange"
              />
            </div>
          </div>
        </div>

        <!-- 右侧控制面板 -->
        <div class="space-y-6">
          <!-- 算法配置面板 -->
          <AlgorithmPanel
            :algorithm-configs="algorithmConfigs"
            :selected-algorithm="selectedAlgorithm"
            :algorithm-info="algorithmInfo"
            @algorithm-change="handleAlgorithmChange"
            @config-change="handleConfigChange"
          />

          <!-- 测试控制面板 -->
          <TestPanel
            :test-scenarios="testScenarios"
            :active-test-scenario="activeTestScenario"
            :is-running-test="isRunningTest"
            :test-progress="testProgress"
            :beacons-count="beacons.length"
            :test-points-count="testPoints.length"
            @scenario-change="activeTestScenario = $event"
            @run-test="handleRunTest"
            @stop-test="stopTest"
            @generate-random="generateRandomTestData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '多算法定位引擎对比'
  description: '对比多种定位算法的性能和精度，可视化展示算法差异'
</route>
