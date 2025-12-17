<script setup lang="ts">
import { useDrawing } from '../composables/useDrawing'

const emit = defineEmits<{
  update: [imageData: number[]]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { handleMouseDown, handleMouseMove, handleMouseUp, clear, getImageData, initCanvas } = useDrawing(canvasRef)

onMounted(() => {
  initCanvas()
})

function handleClear() {
  clear()
  emit('update', [])
}

function handleDrawEnd() {
  const imageData = getImageData()
  emit('update', imageData)
}
</script>

<template>
  <div flex flex-col gap-4 items-center>
    <canvas
      ref="canvasRef"
      width="280"
      height="280"

      rounded-lg cursor-crosshair shadow-md
      border="2 solid gray-300"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp(); handleDrawEnd()"
      @mouseleave="handleMouseUp"
    />
    <NButton type="warning" @click="handleClear">
      清除画布
    </NButton>
  </div>
</template>
