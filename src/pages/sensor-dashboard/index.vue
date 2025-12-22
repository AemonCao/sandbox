<script setup lang="ts">
import DeviceTypeIndicator from './components/DeviceTypeIndicator.vue'
import SensorGrid from './components/SensorGrid.vue'
import { useDeviceDetection } from './composables/useDeviceDetection'
import { useSensorManager } from './composables/useSensorManager'

const { categories, startAll, stopAll, requestPermission } = useSensorManager()
const deviceDetection = useDeviceDetection()

onMounted(() => {
  startAll()
})

onUnmounted(() => {
  stopAll()
})

function handlePermissionRequest(sensorId: string) {
  requestPermission(sensorId)
}
</script>

<template>
  <div

    bg-gradient-to-br="from-blue-50 to-indigo-100"

    p-6 min-h-screen dark:from-gray-900 dark:to-gray-800
  >
    <div mb-8>
      <h1 text-4xl text-gray-800 font-bold mb-2 text-center dark:text-gray-100>
        浏览器传感器仪表板
      </h1>
      <p text-gray-600 mb-6 text-center dark:text-gray-300>
        实时监控浏览器传感器和设备能力
      </p>

      <div mb-6 flex justify-center>
        <DeviceTypeIndicator
          :device-type="deviceDetection.deviceType.value"
          :screen-size="deviceDetection.screenSize.value"
          :has-touch="deviceDetection.hasTouch.value"
        />
      </div>

      <div flex gap-4 justify-center>
        <button

          text-white px-6 py-2 rounded-lg bg-blue-500 shadow-md transition-colors hover:bg-blue-600 hover:shadow-lg
          @click="startAll"
        >
          启动所有传感器
        </button>
        <button

          text-white px-6 py-2 rounded-lg bg-gray-500 shadow-md transition-colors hover:bg-gray-600 hover:shadow-lg
          @click="stopAll"
        >
          停止所有传感器
        </button>
      </div>
    </div>

    <div mx-auto max-w-7xl>
      <SensorGrid
        v-for="category in categories"
        :key="category.name"
        :category="category"
        @request-permission="handlePermissionRequest"
      />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '浏览器传感器状态'
  description: '实时监控浏览器传感器数据，支持历史记录和图表可视化'
</route>
