<script setup lang="ts">
import type { SensorCategory } from '../composables/types'
import SensorCard from './SensorCard.vue'

interface Props {
  category: SensorCategory
}

defineProps<Props>()
const emit = defineEmits<{
  requestPermission: [sensorId: string]
}>()
</script>

<template>
  <div mb-8>
    <h2 text="6 md:6" text-gray-800 font-bold mb-4 dark:text-gray-100>
      {{ category.name }}
    </h2>
    <div

      gap-4 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4
    >
      <SensorCard
        v-for="sensor in category.sensors"
        :key="sensor.id"
        :sensor="sensor"
        @request-permission="emit('requestPermission', $event)"
      />
    </div>
  </div>
</template>
