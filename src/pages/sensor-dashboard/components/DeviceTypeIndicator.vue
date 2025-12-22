<script setup lang="ts">
import type { DeviceType } from '../composables/types'

interface Props {
  deviceType: DeviceType
  screenSize: { width: number, height: number }
  hasTouch: boolean
}

const props = defineProps<Props>()

const deviceIcon = computed(() => {
  switch (props.deviceType) {
    case 'mobile': return '📱'
    case 'tablet': return '📱'
    case 'desktop': return '💻'
    default: return '❓'
  }
})

const deviceTypeLabel = computed(() => {
  switch (props.deviceType) {
    case 'mobile': return '手机'
    case 'tablet': return '平板'
    case 'desktop': return '桌面'
    default: return '未知'
  }
})
</script>

<template>
  <div
    bg-gradient-to-r="dark:from-blue-500 dark:to-purple-600 from-blue-100 to-purple-100"
    text="dark:white gray-800" p-4 rounded-lg shadow-lg
  >
    <div flex gap-3 items-center>
      <div text-4xl>
        {{ deviceIcon }}
      </div>
      <div>
        <div text-xl font-bold>
          {{ deviceTypeLabel }}
        </div>
        <div text-sm opacity-90>
          {{ screenSize.width }} × {{ screenSize.height }}
        </div>
        <div text-xs opacity-75>
          触摸: {{ hasTouch ? '支持' : '不支持' }}
        </div>
      </div>
    </div>
  </div>
</template>
