<script setup lang="ts">
import { useDrawing } from '../composables/useDrawing'

const emit = defineEmits<{
  update: [imageData: number[]]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const preview28Ref = ref<HTMLCanvasElement | null>(null)
const preview784Ref = ref<HTMLCanvasElement | null>(null)
const { handleMouseDown, handleMouseMove, handleMouseUp, clear, getImageData, initCanvas } = useDrawing(canvasRef)

onMounted(() => {
  initCanvas()
})

function handleClear() {
  clear()
  clearPreviews()
  emit('update', [])
}

function clearPreviews() {
  if (preview28Ref.value) {
    const ctx = preview28Ref.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 28, 28)
    }
  }
  if (preview784Ref.value) {
    const ctx = preview784Ref.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 784, 1)
    }
  }
}

function handleDrawEnd() {
  const { data, imageData28 } = getImageData()

  if (imageData28 && preview28Ref.value) {
    const ctx = preview28Ref.value.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData28, 0, 0)
    }
  }

  if (data.length > 0 && preview784Ref.value) {
    const ctx = preview784Ref.value.getContext('2d')
    if (ctx) {
      const imageData = ctx.createImageData(784, 1)
      for (let i = 0; i < data.length; i++) {
        const idx = i * 4
        imageData.data[idx] = data[i]
        imageData.data[idx + 1] = data[i]
        imageData.data[idx + 2] = data[i]
        imageData.data[idx + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
  }

  emit('update', data)
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

    <div flex gap-4 items-center>
      <div flex flex-col gap-2 items-center>
        <div text-sm text-gray-600>
          28×28 预览
        </div>
        <canvas
          ref="preview28Ref"
          width="28"
          height="28"
          style="width: 140px; height: 140px; image-rendering: pixelated;"
          rounded border="1 solid gray-300"
        />
      </div>

      <div flex flex-col gap-2 items-center>
        <div text-sm text-gray-600>
          1×784 预览
        </div>
        <canvas
          ref="preview784Ref"
          width="784"
          height="1"
          style="width: 280px; height: 28px; image-rendering: pixelated;"
          rounded border="1 solid gray-300"
        />
      </div>
    </div>
  </div>
</template>
