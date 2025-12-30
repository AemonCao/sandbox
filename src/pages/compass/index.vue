<script setup lang="ts">
import CompassDial from './components/CompassDial.vue'
import { useCompass } from './composables/useCompass'

const compass = useCompass()

onMounted(async () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    compass.needsPermission.value = true
  }
  else {
    compass.start()
  }
})

onUnmounted(() => {
  compass.stop()
})

async function handleRequestPermission() {
  await compass.requestPermission()
}
</script>

<template>
  <div p-4 flex flex-col min-h-screen items-center justify-center from-blue-50 to-indigo-100 bg-gradient-to-br dark:from-gray-900 dark:to-black>
    <div v-if="compass.needsPermission.value && !compass.isPermissionGranted.value" text-center>
      <p text-lg text-gray-600 mb-6 dark:text-gray-300>
        需要访问设备方位传感器
      </p>
      <button
        text-white font-medium px-8 py-4 rounded-full bg-blue-600 shadow-lg transition-all duration-300 hover:bg-blue-700
        @click="handleRequestPermission"
      >
        授予权限
      </button>
    </div>
    <div v-else-if="compass.error.value" text-center>
      <p text-lg text-red-400>
        {{ compass.error.value }}
      </p>
    </div>
    <CompassDial v-else :heading="compass.heading.value" />
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '指南针'
  description: '基于设备方位传感器的指南针'
  tags: ['传感器', '工具']
</route>
