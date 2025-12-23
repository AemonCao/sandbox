<script setup lang="ts">
defineProps<{
  lines: string[]
  fontFamily?: string
}>()
</script>

<template>
  <div p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800>
    <pre
      :style="{ fontFamily }"
      class="chart-canvas"
      text-sm text-gray-800 leading-tight whitespace-pre overflow-x-auto md:text-base dark:text-gray-200
      v-html="lines.join('\n')"
    />
  </div>
</template>

<style scoped>
.chart-canvas {
  --chart-axis-color: #666;
  --chart-grid-color: #ccc;
  --chart-line-color: #3b82f6;
  --chart-point-color: #10b981;
  --chart-bar-color: #8b5cf6;
  --chart-blocking-color: #ef4444;
  --chart-loading-color: #f59e0b;
}

@media (prefers-color-scheme: dark) {
  .chart-canvas {
    --chart-axis-color: #9ca3af;
    --chart-grid-color: #4b5563;
    --chart-line-color: #60a5fa;
    --chart-point-color: #34d399;
    --chart-bar-color: #a78bfa;
    --chart-blocking-color: #f87171;
    --chart-loading-color: #fbbf24;
  }
}
</style>
