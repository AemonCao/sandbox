<script setup lang="ts">
interface Props {
  data: number[]
  colorIndex?: number
  min?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  colorIndex: 0,
})

const isDark = useDark()

const colors = computed(() => isDark.value
  ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c']
  : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'])

const color = computed(() => colors.value[props.colorIndex % colors.value.length])

const points = computed(() => {
  if (!props.data || props.data.length < 2)
    return ''
  const max = props.max ?? 1
  const min = props.min ?? 0
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
