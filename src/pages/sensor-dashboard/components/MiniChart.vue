<script setup lang="ts">
interface Props {
  data: number[]
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3b82f6',
})

const points = computed(() => {
  if (!props.data || props.data.length < 2)
    return ''
  const max = Math.max(...props.data)
  const min = Math.min(...props.data)
  const range = max - min || 1
  return props.data.map((v, i) => {
    const x = (i / (props.data.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
})
</script>

<template>
  <svg v-if="data && data.length > 1" viewBox="0 0 100 100" h-12 w-full preserveAspectRatio="none">
    <polyline
      :points="points"
      fill="none"
      :stroke="color"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
