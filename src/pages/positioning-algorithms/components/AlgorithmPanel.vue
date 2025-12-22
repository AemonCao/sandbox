<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  algorithmConfigs: any
  selectedAlgorithm: string
  algorithmInfo: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  algorithmChange: [algorithm: string]
  configChange: [algorithm: string, config: any]
}>()

const expandedAlgorithms = ref<string[]>([props.selectedAlgorithm])

// 算法配置模板
const algorithmConfigTemplates = {
  trilateration: [
    {
      key: 'weight',
      label: '权重系数',
      type: 'number',
      min: 0.1,
      max: 2.0,
      step: 0.1,
      description: '算法结果权重',
    },
    {
      key: 'noiseReduction',
      label: '噪声滤波',
      type: 'checkbox',
      description: '启用噪声减少算法',
    },
    {
      key: 'outlierThreshold',
      label: '异常值阈值',
      type: 'number',
      min: 1.0,
      max: 5.0,
      step: 0.1,
      description: '异常数据剔除阈值',
    },
  ],
  fingerprinting: [
    {
      key: 'kNearest',
      label: 'K近邻数',
      type: 'number',
      min: 1,
      max: 10,
      step: 1,
      description: '最近邻匹配数量',
    },
    {
      key: 'signalTolerance',
      label: '信号容差',
      type: 'number',
      min: 1,
      max: 20,
      step: 1,
      description: '信号强度容差(dBm)',
    },
    {
      key: 'interpolationMethod',
      label: '插值方法',
      type: 'select',
      options: ['linear', 'cubic', 'nearest'],
      description: '位置插值算法',
    },
  ],
  centroid: [
    {
      key: 'minBeacons',
      label: '最少信标数',
      type: 'number',
      min: 2,
      max: 6,
      step: 1,
      description: '计算所需最少信标数',
    },
    {
      key: 'weightedAverage',
      label: '加权平均',
      type: 'checkbox',
      description: '使用加权质心算法',
    },
    {
      key: 'signalPower',
      label: '信号权重',
      type: 'number',
      min: 1.0,
      max: 4.0,
      step: 0.1,
      description: '信号强度权重因子',
    },
  ],
  weightedCentroid: [
    {
      key: 'signalPower',
      label: '信号权重',
      type: 'number',
      min: 1.0,
      max: 4.0,
      step: 0.1,
      description: '信号强度权重因子',
    },
    {
      key: 'minSignalStrength',
      label: '最小信号强度',
      type: 'number',
      min: -100,
      max: -50,
      step: 1,
      description: '有效信号最小阈值(dBm)',
    },
    {
      key: 'maxDistanceRatio',
      label: '最大距离比',
      type: 'number',
      min: 1.0,
      max: 5.0,
      step: 0.1,
      description: '距离过滤比例',
    },
  ],
  kalmanFilter: [
    {
      key: 'processNoise',
      label: '过程噪声',
      type: 'number',
      min: 0.01,
      max: 1.0,
      step: 0.01,
      description: '系统过程噪声',
    },
    {
      key: 'measurementNoise',
      label: '测量噪声',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      description: '测量噪声标准差',
    },
    {
      key: 'initialStateEstimate',
      label: '初始状态',
      type: 'coordinate',
      description: '初始位置估计',
    },
  ],
  particleFilter: [
    {
      key: 'particleCount',
      label: '粒子数量',
      type: 'number',
      min: 50,
      max: 500,
      step: 10,
      description: '蒙特卡洛粒子数',
    },
    {
      key: 'motionNoise',
      label: '运动噪声',
      type: 'number',
      min: 0.1,
      max: 2.0,
      step: 0.1,
      description: '运动模型噪声',
    },
    {
      key: 'measurementNoise',
      label: '测量噪声',
      type: 'number',
      min: 0.5,
      max: 5.0,
      step: 0.1,
      description: '测量噪声标准差',
    },
    {
      key: 'resamplingThreshold',
      label: '重采样阈值',
      type: 'number',
      min: 0.1,
      max: 0.9,
      step: 0.1,
      description: '粒子重采样阈值',
    },
  ],
}

// 算法颜色配置
const algorithmColors = {
  trilateration: '#8b5cf6',
  fingerprinting: '#f59e0b',
  centroid: '#ec4899',
  weightedCentroid: '#06b6d4',
  kalmanFilter: '#84cc16',
  particleFilter: '#f97316',
}

// 计算属性
const availableAlgorithms = computed(() => {
  return Object.keys(props.algorithmConfigs).filter(algorithm =>
    props.algorithmConfigs[algorithm]?.enabled !== false,
  )
})

// 方法
function toggleAlgorithmExpansion(algorithm: string) {
  const index = expandedAlgorithms.value.indexOf(algorithm)
  if (index === -1) {
    expandedAlgorithms.value.push(algorithm)
  }
  else {
    expandedAlgorithms.value.splice(index, 1)
  }
}

function selectAlgorithm(algorithm: string) {
  emit('algorithmChange', algorithm)
  if (!expandedAlgorithms.value.includes(algorithm)) {
    expandedAlgorithms.value.push(algorithm)
  }
}

function updateConfig(algorithm: string, key: string, value: any) {
  emit('configChange', algorithm, { [key]: value })
}

function resetToDefaults(algorithm: string) {
  const defaults: any = {
    trilateration: { enabled: true, weight: 1.0, noiseReduction: false, outlierThreshold: 2.0 },
    fingerprinting: { enabled: true, kNearest: 3, signalTolerance: 5, interpolationMethod: 'linear' },
    centroid: { enabled: true, minBeacons: 3, weightedAverage: true, signalPower: 2.0 },
    weightedCentroid: { enabled: true, signalPower: 2.5, minSignalStrength: -90, maxDistanceRatio: 2.0 },
    kalmanFilter: { enabled: true, processNoise: 0.1, measurementNoise: 1.0, initialStateEstimate: { x: 0, y: 0 } },
    particleFilter: { enabled: true, particleCount: 100, motionNoise: 0.5, measurementNoise: 2.0, resamplingThreshold: 0.5 },
  }

  if (defaults[algorithm]) {
    emit('configChange', algorithm, defaults[algorithm])
  }
}

function getAlgorithmIcon(algorithm: string): string {
  const icons = {
    trilateration: '📐',
    fingerprinting: '🔍',
    centroid: '⚖️',
    weightedCentroid: '⚖️',
    kalmanFilter: '📊',
    particleFilter: '🎯',
  }
  return icons[algorithm as keyof typeof icons] || '📍'
}
</script>

<template>
  <div class="border border-gray-200 rounded-lg bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg text-gray-900 font-semibold dark:text-white">
        算法配置
      </h3>
    </div>

    <div class="p-4 max-h-96 overflow-y-auto space-y-3">
      <!-- 算法列表 -->
      <div v-for="algorithm in availableAlgorithms" :key="algorithm" class="border border-gray-200 rounded-lg dark:border-gray-600">
        <!-- 算法头部 -->
        <div
          class="p-3 flex cursor-pointer transition-colors items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="toggleAlgorithmExpansion(algorithm)"
        >
          <div class="flex items-center space-x-3">
            <div
              class="rounded-full h-4 w-4"
              :style="{ backgroundColor: algorithmColors[algorithm as keyof typeof algorithmColors] }"
            />

            <span class="text-lg">{{ getAlgorithmIcon(algorithm) }}</span>

            <div>
              <div class="text-gray-900 font-medium dark:text-white">
                {{ algorithmInfo[algorithm]?.name || algorithm }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ algorithmInfo[algorithm]?.description?.substring(0, 50) }}...
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <!-- 选择按钮 -->
            <button
              class="text-xs font-medium px-3 py-1 rounded transition-colors" :class="[
                selectedAlgorithm === algorithm
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300',
              ]"
              @click.stop="selectAlgorithm(algorithm)"
            >
              {{ selectedAlgorithm === algorithm ? '已选择' : '选择' }}
            </button>

            <!-- 展开图标 -->
            <svg
              class="text-gray-500 h-4 w-4 transition-transform" :class="[
                expandedAlgorithms.includes(algorithm) ? 'rotate-90' : '',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- 算法配置面板 -->
        <div v-show="expandedAlgorithms.includes(algorithm)" class="p-3 border-t border-gray-200 space-y-3 dark:border-gray-600">
          <!-- 启用/禁用开关 -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 font-medium dark:text-gray-300">启用算法</span>
            <label class="inline-flex cursor-pointer items-center relative">
              <input
                :checked="algorithmConfigs[algorithm]?.enabled !== false"
                type="checkbox"
                class="peer sr-only"
                @change="updateConfig(algorithm, 'enabled', ($event.target as HTMLInputElement).checked)"
              >
              <div class="peer rounded-full bg-gray-200 h-6 w-11 peer-focus:outline-none after:rounded-full after:bg-white dark:bg-gray-700 peer-checked:bg-blue-600 after:h-5 after:w-5 after:content-[''] after:transition-all after:left-[2px] after:top-[2px] after:absolute peer-checked:after:border-white peer-checked:after:translate-x-full" />
            </label>
          </div>

          <!-- 算法特定配置 -->
          <div v-if="algorithmConfigTemplates[algorithm as keyof typeof algorithmConfigTemplates]" class="space-y-3">
            <div
              v-for="config in algorithmConfigTemplates[algorithm as keyof typeof algorithmConfigTemplates]"
              :key="config.key"
              class="space-y-1"
            >
              <label class="text-sm text-gray-700 font-medium dark:text-gray-300">
                {{ config.label }}
              </label>

              <!-- 数字输入 -->
              <div v-if="config.type === 'number'">
                <input
                  :value="algorithmConfigs[algorithm]?.[config.key] || config.min"
                  :min="config.min"
                  :max="config.max"
                  :step="config.step"
                  type="number"
                  class="text-sm px-3 py-2 border border-gray-300 rounded-md w-full dark:text-white dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 focus:ring-blue-500"
                  @input="updateConfig(algorithm, config.key, Number(($event.target as HTMLInputElement).value))"
                >
              </div>

              <!-- 复选框 -->
              <div v-else-if="config.type === 'checkbox'">
                <label class="inline-flex cursor-pointer items-center relative">
                  <input
                    :checked="algorithmConfigs[algorithm]?.[config.key] || false"
                    type="checkbox"
                    class="peer sr-only"
                    @change="updateConfig(algorithm, config.key, ($event.target as HTMLInputElement).checked)"
                  >
                  <div class="peer rounded-full bg-gray-200 h-6 w-11 peer-focus:outline-none after:rounded-full after:bg-white dark:bg-gray-700 peer-checked:bg-blue-600 after:h-5 after:w-5 after:content-[''] after:transition-all after:left-[2px] after:top-[2px] after:absolute peer-checked:after:border-white peer-checked:after:translate-x-full" />
                </label>
              </div>

              <!-- 选择框 -->
              <div v-else-if="config.type === 'select'">
                <select
                  :value="algorithmConfigs[algorithm]?.[config.key] || config.options?.[0]"
                  class="text-sm px-3 py-2 border border-gray-300 rounded-md w-full dark:text-white dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 focus:ring-blue-500"
                  @change="updateConfig(algorithm, config.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="option in config.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </div>

              <!-- 坐标输入 -->
              <div v-else-if="config.type === 'coordinate'" class="flex space-x-2">
                <input
                  :value="algorithmConfigs[algorithm]?.[config.key]?.x || 0"
                  type="number"
                  placeholder="X"
                  class="text-sm px-3 py-2 border border-gray-300 rounded-md flex-1 dark:text-white dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 focus:ring-blue-500"
                  @input="updateConfig(algorithm, config.key, {
                    ...algorithmConfigs[algorithm]?.[config.key],
                    x: Number(($event.target as HTMLInputElement).value),
                  })"
                >
                <input
                  :value="algorithmConfigs[algorithm]?.[config.key]?.y || 0"
                  type="number"
                  placeholder="Y"
                  class="text-sm px-3 py-2 border border-gray-300 rounded-md flex-1 dark:text-white dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 focus:ring-blue-500"
                  @input="updateConfig(algorithm, config.key, {
                    ...algorithmConfigs[algorithm]?.[config.key],
                    y: Number(($event.target as HTMLInputElement).value),
                  })"
                >
              </div>

              <!-- 配置描述 -->
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ config.description }}
              </p>
            </div>
          </div>

          <!-- 算法说明 -->
          <div v-if="algorithmInfo[algorithm]" class="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <div class="font-medium mb-1">
                算法特点：
              </div>
              <div class="text-xs space-y-1">
                <div><span class="font-medium">优点：</span> {{ algorithmInfo[algorithm].advantages?.join(', ') }}</div>
                <div><span class="font-medium">缺点：</span> {{ algorithmInfo[algorithm].disadvantages?.join(', ') }}</div>
              </div>
            </div>
          </div>

          <!-- 重置按钮 -->
          <div class="pt-2">
            <button
              class="text-sm text-gray-700 px-3 py-2 rounded-md bg-gray-100 w-full transition-colors dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              @click="resetToDefaults(algorithm)"
            >
              重置为默认配置
            </button>
          </div>
        </div>
      </div>

      <!-- 无可用算法提示 -->
      <div v-if="availableAlgorithms.length === 0" class="text-gray-500 py-8 text-center dark:text-gray-400">
        <div class="text-4xl mb-2">
          ⚙️
        </div>
        <div>暂无可用的算法</div>
        <div class="text-sm mt-1">
          请在上方算法列表中启用至少一个算法
        </div>
      </div>
    </div>
  </div>
</template>
