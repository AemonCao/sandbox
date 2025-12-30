<script setup lang="ts">
import ParameterControls from './components/ParameterControls.vue'
import { useMotionSensors } from './composables/useMotionSensors'
import { usePostureHistory } from './composables/usePostureHistory'
import { usePostureParameters } from './composables/usePostureParameters'
import { usePostureRecognition } from './composables/usePostureRecognition'

// 参数管理
const { parameters, updateParameter, reset } = usePostureParameters()

// 运动传感器
const sensors = useMotionSensors()

// 姿态识别
const recognition = usePostureRecognition(
  sensors.acceleration,
  sensors.orientation,
  parameters,
)

// 姿态历史
const history = usePostureHistory(recognition.currentPosture)

// 生命周期
onMounted(async () => {
  // 检查是否需要权限
  if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    // iOS 设备，需要用户交互触发权限请求
    sensors.needsPermission.value = true
  }
  else {
    // 非 iOS 设备，直接启动
    sensors.start()
    recognition.start()
  }
})

onUnmounted(() => {
  sensors.stop()
  recognition.stop()
})

// 请求权限
async function handleRequestPermission() {
  await sensors.requestPermission()
  if (sensors.isPermissionGranted.value) {
    recognition.start()
  }
}

// 姿态类型中文映射
const postureLabels: Record<string, string> = {
  idle: '静止',
  standing: '站立',
  walking: '行走',
  running: '跑步',
}

// 方向中文映射
const directionLabels: Record<string, string> = {
  north: '北',
  south: '南',
  east: '东',
  west: '西',
  northeast: '东北',
  northwest: '西北',
  southeast: '东南',
  southwest: '西南',
  stationary: '静止',
}
</script>

<template>
  <div p-4 min-h-screen from-blue-50 to-indigo-100 bg-gradient-to-br dark:from-gray-900 dark:to-gray-800>
    <div mx-auto max-w-6xl>
      <!-- 标题 -->
      <div mb-6 text-center>
        <h1 text-3xl text-gray-800 font-bold dark:text-white>
          姿态识别
        </h1>
        <p text-sm text-gray-600 mt-2 dark:text-gray-400>
          基于加速度和方位传感器的实时姿态识别
        </p>
      </div>

      <!-- 权限请求 -->
      <div v-if="sensors.needsPermission.value" mb-6 p-6 text-center rounded-lg bg-white shadow-lg dark:bg-gray-800>
        <p text-gray-700 mb-4 dark:text-gray-300>
          需要访问设备运动传感器
        </p>
        <button

          text-white font-medium px-6 py-3 rounded-lg bg-blue-500 transition-all duration-300 hover:bg-blue-600
          @click="handleRequestPermission"
        >
          授予权限
        </button>
      </div>

      <!-- 错误提示 -->
      <div v-if="sensors.error.value" text-red-700 mb-6 p-4 rounded-lg bg-red-100 dark:text-red-200 dark:bg-red-900>
        {{ sensors.error.value }}
      </div>

      <!-- 当前姿态 -->
      <div mb-6 p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800>
        <h2 text-xl text-gray-800 font-bold mb-4 dark:text-white>
          当前姿态
        </h2>
        <div gap-4 grid grid-cols-2 md:grid-cols-4>
          <div>
            <div text-sm text-gray-600 dark:text-gray-400>
              姿态
            </div>
            <div text-2xl text-blue-600 font-bold dark:text-blue-400>
              {{ postureLabels[recognition.currentPosture.value.type] }}
            </div>
          </div>
          <div>
            <div text-sm text-gray-600 dark:text-gray-400>
              方向
            </div>
            <div text-2xl text-green-600 font-bold dark:text-green-400>
              {{ directionLabels[recognition.currentPosture.value.direction] }}
            </div>
          </div>
          <div>
            <div text-sm text-gray-600 dark:text-gray-400>
              置信度
            </div>
            <div text-2xl text-purple-600 font-bold dark:text-purple-400>
              {{ (recognition.currentPosture.value.confidence * 100).toFixed(0) }}%
            </div>
          </div>
          <div>
            <div text-sm text-gray-600 dark:text-gray-400>
              速度
            </div>
            <div text-2xl text-orange-600 font-bold dark:text-orange-400>
              {{ recognition.currentPosture.value.speed.toFixed(1) }} m/s
            </div>
          </div>
        </div>
      </div>

      <!-- 传感器数据 -->
      <div mb-6 p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800>
        <h2 text-xl text-gray-800 font-bold mb-4 dark:text-white>
          传感器数据
        </h2>
        <div gap-4 grid grid-cols-1 md:grid-cols-2>
          <div>
            <div text-sm text-gray-600 font-medium mb-2 dark:text-gray-400>
              加速度 (m/s²)
            </div>
            <div text-sm space-y-1>
              <div>X: {{ sensors.acceleration.value.x.toFixed(2) }}</div>
              <div>Y: {{ sensors.acceleration.value.y.toFixed(2) }}</div>
              <div>Z: {{ sensors.acceleration.value.z.toFixed(2) }}</div>
            </div>
          </div>
          <div>
            <div text-sm text-gray-600 font-medium mb-2 dark:text-gray-400>
              方位 (°)
            </div>
            <div text-sm space-y-1>
              <div>Alpha: {{ sensors.orientation.value.alpha.toFixed(1) }}</div>
              <div>Beta: {{ sensors.orientation.value.beta.toFixed(1) }}</div>
              <div>Gamma: {{ sensors.orientation.value.gamma.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史统计 -->
      <div v-if="history.formattedStatistics.value.length > 0" p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800>
        <h2 text-xl text-gray-800 font-bold mb-4 dark:text-white>
          统计数据
        </h2>
        <div space-y-3>
          <div v-for="stat in history.formattedStatistics.value" :key="stat.type">
            <div mb-1 flex items-center justify-between>
              <span text-sm text-gray-700 font-medium dark:text-gray-300>
                {{ postureLabels[stat.type] }}
              </span>
              <span text-sm text-gray-600 dark:text-gray-400>
                {{ stat.formattedDuration }} ({{ stat.percentage.toFixed(1) }}%)
              </span>
            </div>
            <div rounded-full bg-gray-200 h-2 w-full dark:bg-gray-700>
              <div
                rounded-full bg-blue-500 h-2 transition-all duration-300
                :style="{ width: `${stat.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 参数调节面板 -->
    <ParameterControls
      :parameters="parameters"
      :on-update="updateParameter"
      :on-reset="reset"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '姿态识别'
  description: '基于加速度和方位传感器的实时姿态识别'
  tags: ['传感器', '机器学习', '运动检测']
</route>
