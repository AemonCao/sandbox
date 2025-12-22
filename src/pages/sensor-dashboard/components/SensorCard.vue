<script setup lang="ts">
import type { SensorData } from '../composables/types'
import { downsample } from '../composables/useSampling'
import MiniChart from './MiniChart.vue'
import PermissionButton from './PermissionButton.vue'

interface Props {
  sensor: SensorData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  requestPermission: [sensorId: string]
}>()
const chartData = computed(() => {
  if (!props.sensor.chartFields || !props.sensor.value)
    return null
  const data: Record<string, number[]> = {}
  props.sensor.chartFields.forEach((field) => {
    const history = (props.sensor as any)[`${field}History`]
    if (history && Array.isArray(history))
      data[field] = downsample(history, 100)
  })
  return Object.keys(data).length > 0 ? data : null
})
const statusColor = computed(() => {
  switch (props.sensor.status) {
    case 'available': return 'bg-green-500'
    case 'unavailable': return 'bg-gray-400'
    case 'permission-needed': return 'bg-orange-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
})

const statusText = computed(() => {
  switch (props.sensor.status) {
    case 'available': return '可用'
    case 'unavailable': return '不可用'
    case 'permission-needed': return '需要权限'
    case 'error': return '错误'
    default: return '未知'
  }
})

function formatTimestamp(timestamp: number) {
  if (!timestamp)
    return '从未更新'
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 1000)
    return '刚刚'
  if (diff < 60000)
    return `${Math.floor(diff / 1000)}秒前`
  if (diff < 3600000)
    return `${Math.floor(diff / 60000)}分钟前`
  return new Date(timestamp).toLocaleTimeString()
}

function formatValue(value: any) {
  if (value === null || value === undefined)
    return '-'
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n')
  }
  return String(value)
}
</script>

<template>
  <div

    border="2 transparent"
    p-4 rounded-lg bg-white shadow-md transition-all duration-300 hover:border-blue-400 dark:bg-gray-800 hover:shadow-lg hover:scale-102
  >
    <div mb-3 flex items-center justify-between>
      <div flex gap-2 items-center>
        <div
          rounded-full h-3 w-3
          :class="statusColor"
        />
        <h3 text-lg text-gray-800 font-semibold dark:text-gray-100>
          {{ sensor.name }}
        </h3>
      </div>
      <div text-xs text-gray-500 dark:text-gray-400>
        {{ formatTimestamp(sensor.lastUpdate) }}
      </div>
    </div>

    <div mb-2>
      <span

        :class="statusColor"
        text-xs text-white font-medium px-2 py-1 rounded
      >
        {{ statusText }}
      </span>
    </div>

    <div v-if="sensor.status === 'available'">
      <div py-4 text-center>
        <div

          text-2xl text-blue-600 font-bold whitespace-pre-line dark:text-blue-400
        >
          {{ formatValue(sensor.value) }}
        </div>
        <div v-if="sensor.unit" text-sm text-gray-500 mt-1 dark:text-gray-400>
          {{ sensor.unit }}
        </div>
      </div>
      <div v-if="chartData" mt-2 space-y-2>
        <div v-for="(data, field, index) in chartData" :key="field">
          <div text-xs text-gray-500 mb-1 dark:text-gray-400>
            {{ field }}
          </div>
          <MiniChart :data="data" :color-index="index" :min="sensor.chartMin" :max="sensor.chartMax" />
        </div>
      </div>
    </div>

    <div v-else-if="sensor.status === 'unavailable'" py-4 text-center>
      <div text-gray-400 dark:text-gray-500>
        传感器不可用
      </div>
    </div>

    <PermissionButton
      v-if="sensor.status === 'permission-needed'"
      @request="emit('requestPermission', sensor.id)"
    />

    <div v-if="sensor.error" text-sm text-red-500 mt-2 dark:text-red-400>
      {{ sensor.error }}
    </div>
  </div>
</template>
