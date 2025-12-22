<script setup lang="ts">
const props = defineProps<{
  predictions: number[]
}>()

const sortByProb = ref(false)

const maxIndex = computed(() => {
  const max = Math.max(...props.predictions)
  return props.predictions.indexOf(max)
})

const sortedPredictions = computed(() => {
  const items = props.predictions.map((prob, index) => ({ prob, index }))
  return sortByProb.value ? items.sort((a, b) => b.prob - a.prob) : items
})
</script>

<template>
  <div flex flex-col gap-3>
    <NButton size="large" @click="sortByProb = !sortByProb">
      {{ sortByProb ? '默认排序' : '按概率排序' }}
    </NButton>
    <div
      v-for="{ prob, index } in sortedPredictions"
      :key="index"

      p-3 rounded-lg flex gap-3 transition-all items-center
      :class="index === maxIndex ? 'bg-blue-50 border-2 border-blue-400 dark:bg-blue-900 dark:border-blue-500' : 'bg-gray-50 dark:bg-gray-700'"
    >
      <div text="6 md:6" font-bold text-center w-8 dark:text-gray-200>
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
      <div text="3.5 md:3.5" font-medium text-right w-20 dark:text-gray-200>
        {{ (prob * 100).toFixed(5) }}%
      </div>
    </div>
  </div>
</template>
