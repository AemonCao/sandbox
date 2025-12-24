<script setup lang="ts">
import { useConwayGame } from './useConwayGame'

const {
  canvasRef,
  containerRef,
  generation,
  population,
  isPlaying,
  fps,
  resolution,
  togglePlay,
  step,
  randomize,
  clear,
} = useConwayGame()

const isDark = useDark()
</script>

<template>
  <div
    flex="~ col"
    h-screen
    overflow-hidden
    from-indigo-50 to-pink-50 via-purple-50 bg-gradient-to-br dark:from-gray-900 dark:to-indigo-900 dark:via-purple-900
  >
    <!-- Header -->
    <header
      :class="isDark ? 'bg-gray-800/50 backdrop-blur border-b border-gray-700' : 'bg-white/50 backdrop-blur border-b border-purple-200'"
      px-5
      py-3
      flex
      shadow-sm
      items-center
      justify-between
    >
      <h1
        text-xl text-gray-800 font-semibold dark:text-gray-100
      >
        Conway's Game of Life
      </h1>
      <div
        text-sm text-gray-600 font-mono dark:text-gray-400
      >
        <span>代数: {{ generation }}</span> |
        <span>存活: {{ population }}</span>
      </div>
    </header>
    <!-- Canvas -->
    <main
      :ref="(el) => containerRef = el as HTMLElement"
      :class="isDark ? 'bg-gray-950' : 'bg-white/30'"
      flex-1
      cursor-crosshair
      relative
    >
      <canvas :ref="(el) => canvasRef = el as HTMLCanvasElement" />
    </main>
    <div
      px-4 py-3 flex shrink-0 flex-wrap gap-3 items-center justify-center
      :class="isDark ? 'bg-gray-800/50 backdrop-blur border-t border-gray-700' : 'bg-white/50 backdrop-blur border-t border-purple-200'"
    >
      <NButton
        :type="isPlaying ? 'default' : 'success'"
        @click="togglePlay"
      >
        {{ isPlaying ? '暂停' : generation > 0 ? '继续' : '开始' }}
      </NButton>
      <NButton @click="step">
        步进
      </NButton>
      <NButton @click="randomize">
        随机
      </NButton>
      <NButton @click="clear">
        清空
      </NButton>
      <div text-sm flex gap-2.5 items-center>
        <label>速度</label>
        <NSlider v-model:value="fps" :min="1" :max="60" :step="1" w-25 />
      </div>
      <div text-sm flex gap-2.5 items-center>
        <label>大小</label>
        <NSlider v-model:value="resolution" :min="5" :max="50" :step="1" w-25 />
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: 'Conway生命游戏'
  description: 'Conway生命游戏模拟器，支持交互式绘制和自动演化'
  tags: ['算法', '模拟', 'Canvas']
</route>
