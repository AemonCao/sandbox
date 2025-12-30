<script setup lang="ts">
import type { PostureParameters } from '../composables/types'

const props = defineProps<{
  parameters: PostureParameters
  onUpdate: (key: keyof PostureParameters, value: number) => void
  onReset: () => void
}>()

const showPanel = ref(false)

// 参数配置
const parameterConfigs = [
  {
    key: 'movingAverageWindow' as const,
    label: '移动平均窗口',
    min: 5,
    max: 20,
    step: 1,
    unit: '个样本',
  },
  {
    key: 'idleThreshold' as const,
    label: '静止阈值',
    min: 0.1,
    max: 1.0,
    step: 0.1,
    unit: 'm/s²',
  },
  {
    key: 'walkingThreshold' as const,
    label: '行走阈值',
    min: 1.0,
    max: 4.0,
    step: 0.5,
    unit: 'm/s²',
  },
  {
    key: 'runningThreshold' as const,
    label: '跑步阈值',
    min: 6.0,
    max: 12.0,
    step: 0.5,
    unit: 'm/s²',
  },
  {
    key: 'directionHysteresis' as const,
    label: '方向滞后角度',
    min: 5,
    max: 20,
    step: 1,
    unit: '°',
  },
  {
    key: 'postureUpdateInterval' as const,
    label: '更新间隔',
    min: 200,
    max: 1000,
    step: 100,
    unit: 'ms',
  },
]
</script>

<template>
  <div>
    <!-- 悬浮按钮 -->
    <button

      text-white rounded-full bg-blue-500 flex h-14 w-14 shadow-lg transition-all duration-300 items-center bottom-6 right-6 justify-center fixed z-50 hover:bg-blue-600 md:h-16 md:w-16
      @click="showPanel = !showPanel"
    >
      <div i-carbon-settings text-2xl />
    </button>

    <!-- 参数面板 -->
    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-300"
      enter-from-class="translate-y-full md:translate-y-0 md:translate-x-full"
      leave-to-class="translate-y-full md:translate-y-0 md:translate-x-full"
    >
      <div
        v-if="showPanel"

        h="[75vh]"

        p-6 bg-white w-full shadow-2xl bottom-0 left-0 right-0 fixed z-40 overflow-y-auto dark:bg-gray-800 md:h-full md:w-96 md:bottom-auto md:left-auto md:right-0 md:top-0
      >
        <!-- 标题 -->
        <div mb-6 flex items-center justify-between>
          <h3 text-xl text-gray-800 font-bold dark:text-white>
            参数调节
          </h3>
          <button

            p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700
            @click="showPanel = false"
          >
            <div i-carbon-close text-xl />
          </button>
        </div>

        <!-- 参数列表 -->
        <div space-y-6>
          <div v-for="config in parameterConfigs" :key="config.key">
            <div mb-2 flex items-center justify-between>
              <label text-sm text-gray-700 font-medium dark:text-gray-300>
                {{ config.label }}
              </label>
              <span text-sm text-gray-600 dark:text-gray-400>
                {{ parameters[config.key] }} {{ config.unit }}
              </span>
            </div>
            <n-slider
              :value="parameters[config.key]"
              :min="config.min"
              :max="config.max"
              :step="config.step"
              @update:value="(val: number) => props.onUpdate(config.key, val)"
            />
          </div>
        </div>

        <!-- 重置按钮 -->
        <div mt-8>
          <n-button
            block
            type="warning"
            @click="props.onReset"
          >
            重置为默认值
          </n-button>
        </div>

        <!-- 说明 -->
        <div mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900>
          <p text-xs text-gray-600 dark:text-gray-400>
            调节参数会立即生效。建议在不同场景下测试并找到最适合的参数组合。
          </p>
        </div>
      </div>
    </Transition>

    <!-- 遮罩层 -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showPanel"
        bg-black opacity-50 inset-0 fixed z-30
        @click="showPanel = false"
      />
    </Transition>
  </div>
</template>
