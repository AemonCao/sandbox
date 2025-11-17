<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  testScenarios: any[]
  activeTestScenario: string
  isRunningTest: boolean
  testProgress: number
  beaconsCount: number
  testPointsCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'scenario-change': [scenario: string]
  'run-test': []
  'stop-test': []
  'generate-random': []
}>()

const showAdvancedOptions = ref(false)
const customTestConfig = ref({
  testAreaWidth: 100,
  testAreaHeight: 100,
  beaconCount: 4,
  testPointCount: 20,
  noiseLevel: 2,
  iterations: 1,
})

// 测试场景图标
const scenarioIcons = {
  accuracy: '🎯',
  density: '📊',
  noise: '🔊',
  scalability: '📈',
  edge_case: '🎭',
  dynamic: '🏃',
  comparison: '⚖️',
}

// 计算属性
const currentScenarioInfo = computed(() => {
  return props.testScenarios.find(s => s.id === props.activeTestScenario)
})

const estimatedDuration = computed(() => {
  const scenario = currentScenarioInfo.value
  if (!scenario) return '未知'

  let baseTime = 0

  // 根据场景类型估算时间
  switch (scenario.id) {
    case 'accuracy':
      baseTime = scenario.parameters.gridSize * scenario.parameters.gridSize * scenario.parameters.measurementsPerPoint * 50
      break
    case 'density':
      baseTime = scenario.parameters.beaconDensities.length * scenario.parameters.iterations * 1000
      break
    case 'noise':
      baseTime = scenario.parameters.noiseLevels.length * scenario.parameters.testPoints * scenario.parameters.iterations * 100
      break
    case 'scalability':
      baseTime = 5000
      break
    case 'edge_case':
      baseTime = scenario.parameters.testScenarios.length * scenario.parameters.obstructionLevels.length * 200
      break
    case 'dynamic':
      baseTime = scenario.parameters.sampleRate * scenario.parameters.pathLength * 100
      break
    case 'comparison':
      baseTime = scenario.parameters.gridSize * scenario.parameters.gridSize * 100
      break
    default:
      baseTime = 2000
  }

  const duration = baseTime / 1000
  return duration < 60 ? `${Math.ceil(duration)}秒` : `${Math.ceil(duration / 60)}分钟`
})

const canStartTest = computed(() => {
  return props.beaconsCount >= 3 && props.testPointsCount >= 5
})

// 方法
function startTest() {
  if (!canStartTest.value) {
    alert('需要至少3个信标和5个测试点才能开始测试')
    return
  }
  emit('run-test')
}

function stopTest() {
  emit('stop-test')
}

function generateCustomTest() {
  // 根据自定义配置生成测试数据
  emit('generate-random')
}

function getProgressColor(): string {
  if (props.testProgress < 30) return 'bg-red-500'
  if (props.testProgress < 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getTestComplexity(scenario: any): { level: string, color: string } {
  const complexity = scenario.beaconCount * scenario.testPointCount

  if (complexity < 50) return { level: '简单', color: 'text-green-600' }
  if (complexity < 150) return { level: '中等', color: 'text-yellow-600' }
  return { level: '复杂', color: 'text-red-600' }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
    <!-- 标题栏 -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        测试控制
      </h3>
    </div>

    <!-- 内容区域 -->
    <div class="p-4 space-y-4">
      <!-- 当前状态 -->
      <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">信标数量:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ beaconsCount }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">测试点数量:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ testPointsCount }}</span>
          </div>
        </div>

        <!-- 状态指示器 -->
        <div class="mt-2 flex items-center space-x-2">
          <div :class="[
            'w-2 h-2 rounded-full',
            canStartTest ? 'bg-green-500' : 'bg-red-500'
          ]"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ canStartTest ? '可以开始测试' : '需要更多数据' }}
          </span>
        </div>
      </div>

      <!-- 测试场景选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          测试场景
        </label>
        <select
          :value="activeTestScenario"
          :disabled="isRunningTest"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          @change="emit('scenario-change', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="scenario in testScenarios"
            :key="scenario.id"
            :value="scenario.id"
          >
            {{ scenarioIcons[scenario.id as keyof typeof scenarioIcons] }} {{ scenario.name }}
          </option>
        </select>
      </div>

      <!-- 场景信息 -->
      <div v-if="currentScenarioInfo" class="border border-gray-200 rounded-lg p-3 dark:border-gray-600">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-gray-900 dark:text-white">
            {{ currentScenarioInfo.name }}
          </h4>
          <span :class="getTestComplexity(currentScenarioInfo).color" class="text-xs font-medium">
            {{ getTestComplexity(currentScenarioInfo).level }}
          </span>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ currentScenarioInfo.description }}
        </p>

        <div class="text-xs text-gray-500 dark:text-gray-500 space-y-1">
          <div>信标: {{ currentScenarioInfo.beaconCount }}个</div>
          <div>测试点: {{ currentScenarioInfo.testPointCount }}个</div>
          <div>预计耗时: {{ estimatedDuration }}</div>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="isRunningTest" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">测试进度</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ testProgress.toFixed(1) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div
            :class="['h-2 rounded-full transition-all duration-300', getProgressColor()]"
            :style="{ width: `${testProgress}%` }"
          ></div>
        </div>
        <div class="text-xs text-center text-gray-500 dark:text-gray-400">
          测试进行中，请耐心等待...
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="space-y-2">
        <button
          v-if="!isRunningTest"
          :disabled="!canStartTest"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          @click="startTest"
        >
          🚀 开始测试
        </button>

        <button
          v-else
          class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          @click="stopTest"
        >
          ⏹️ 停止测试
        </button>

        <button
          class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          @click="emit('generate-random')"
        >
          🎲 生成随机测试数据
        </button>
      </div>

      <!-- 高级选项 -->
      <div>
        <button
          class="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-between"
          @click="showAdvancedOptions = !showAdvancedOptions"
        >
          <span>⚙️ 高级选项</span>
          <svg
            :class="['w-4 h-4 transition-transform', showAdvancedOptions ? 'rotate-180' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-show="showAdvancedOptions" class="mt-3 space-y-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            自定义测试配置
          </h5>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">测试区域宽度</label>
              <input
                v-model.number="customTestConfig.testAreaWidth"
                type="number"
                min="50"
                max="500"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>

            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">测试区域高度</label>
              <input
                v-model.number="customTestConfig.testAreaHeight"
                type="number"
                min="50"
                max="500"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>

            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">信标数量</label>
              <input
                v-model.number="customTestConfig.beaconCount"
                type="number"
                min="3"
                max="20"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>

            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">测试点数量</label>
              <input
                v-model.number="customTestConfig.testPointCount"
                type="number"
                min="5"
                max="100"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>

            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">噪声水平</label>
              <input
                v-model.number="customTestConfig.noiseLevel"
                type="number"
                min="0"
                max="10"
                step="0.5"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>

            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">测试次数</label>
              <input
                v-model.number="customTestConfig.iterations"
                type="number"
                min="1"
                max="10"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
          </div>

          <button
            class="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
            @click="generateCustomTest"
          >
            生成自定义测试
          </button>
        </div>
      </div>

      <!-- 测试统计 -->
      <div class="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div class="flex items-center justify-between">
          <span>💡 提示: 选择合适的测试场景以获得准确的算法性能对比</span>
        </div>
      </div>
    </div>
  </div>
</template>