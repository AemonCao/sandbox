<script setup lang="ts">
const props = defineProps<{
  predictions: number[]
}>()

const maxIndex = computed(() => {
  const max = Math.max(...props.predictions)
  return props.predictions.indexOf(max)
})
</script>

<template>
  <div flex flex-col gap-3>
    <div
      v-for="(prob, index) in predictions"
      :key="index"

      p-3 rounded-lg flex gap-3 transition-all items-center
      :class="index === maxIndex ? 'bg-blue-50 border-2 border-blue-400 dark:bg-blue-900 dark:border-blue-500' : 'bg-gray-50 dark:bg-gray-700'"
    >
      <div text-2xl font-bold text-center w-8 dark:text-gray-200>
        {{ index }}
      </div>
      <div flex-1>
        <NProgress
          type="line"
          :percentage="prob * 100"
          :color="index === maxIndex ? '#3b82f6' : '#9ca3af'"
          :show-indicator="false"
          :height="20"
        />
      </div>
      <div text-sm font-medium text-right w-16 dark:text-gray-200>
        {{ (prob * 100).toFixed(1) }}%
      </div>
    </div>
  </div>
</template>
