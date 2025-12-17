<script setup lang="ts">
import { useDrawing } from '../composables/useDrawing'

const emit = defineEmits<{
  update: [imageData: number[]]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const preview28Ref = ref<HTMLCanvasElement | null>(null)
const preview784Ref = ref<HTMLCanvasElement | null>(null)
const { handleMouseDown, handleWheel, handleMouseEnter, handleMouseLeave, handleCursorMove, clear, getImageData, initCanvas, isDrawing, brushSize, cursorPos, showCursor } = useDrawing(canvasRef)

onMounted(() => {
  initCanvas()
  clearPreviews()
})

watch(isDrawing, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    handleDrawEnd()
  }
})

function handleClear() {
  clear()
  clearPreviews()
  emit('update', [])
}

const isDark = useDark()

function clearPreviews() {
  const bgColor = isDark.value ? '#fff' : '#000'
  if (preview28Ref.value) {
    const ctx = preview28Ref.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, 28, 28)
    }
  }
  if (preview784Ref.value) {
    const ctx = preview784Ref.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, 784, 1)
    }
  }
}

watch(isDark, () => {
  if (preview28Ref.value) {
    const ctx = preview28Ref.value.getContext('2d')
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, 28, 28)
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255 - imageData.data[i]
        imageData.data[i + 1] = 255 - imageData.data[i + 1]
        imageData.data[i + 2] = 255 - imageData.data[i + 2]
      }
      ctx.putImageData(imageData, 0, 0)
    }
  }
  if (preview784Ref.value) {
    const ctx = preview784Ref.value.getContext('2d')
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, 784, 1)
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255 - imageData.data[i]
        imageData.data[i + 1] = 255 - imageData.data[i + 1]
        imageData.data[i + 2] = 255 - imageData.data[i + 2]
      }
      ctx.putImageData(imageData, 0, 0)
    }
  }
})

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
        const value = isDark.value ? 255 - data[i] : data[i]
        imageData.data[idx] = value
        imageData.data[idx + 1] = value
        imageData.data[idx + 2] = value
        imageData.data[idx + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
  }

  emit('update', data)
}
</script>

<template>
  <div flex flex-col gap-4 w-full items-center>
    <div inline-block relative>
      <canvas
        ref="canvasRef"
        width="280"
        height="280"

        rounded-lg max-w-full cursor-none shadow-md
        border="2 solid gray-300 dark:border-gray-600"
        style="width: min(280px, 100%); height: min(280px, 100%); touch-action: none;"
        @mousedown="handleMouseDown"
        @touchstart="handleMouseDown"
        @wheel="handleWheel"
        @contextmenu.prevent
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousemove="handleCursorMove"
      />
      <div
        v-if="showCursor"
        rounded-full pointer-events-none absolute border="2 solid white"
        :style="{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          width: `${brushSize}px`,
          height: `${brushSize}px`,
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'difference',
        }"
      />
    </div>
    <div flex gap-4 items-center>
      <NButton type="warning" @click="handleClear">
        清除画布
      </NButton>
      <div text-sm text-gray-600 dark:text-gray-400>
        画笔大小: {{ brushSize }}
      </div>
    </div>

    <div flex="~ col sm:row" gap-4 w-full items-center justify-center>
      <div flex flex-col gap-2 items-center>
        <div text-sm text-gray-600 dark:text-gray-400>
          28×28 预览
        </div>
        <canvas
          ref="preview28Ref"
          width="28"
          height="28"
          style="width: min(140px, 40vw); height: min(140px, 40vw); image-rendering: pixelated;"
          rounded border="1 solid gray-300 dark:border-gray-600"
        />
      </div>

      <div flex flex-col gap-2 items-center>
        <div text-sm text-gray-600 dark:text-gray-400>
          1×784 预览
        </div>
        <canvas
          ref="preview784Ref"
          width="784"
          height="1"
          style="width: min(280px, 80vw); height: 28px; image-rendering: pixelated;"
          rounded border="1 solid gray-300 dark:border-gray-600"
        />
      </div>
    </div>
  </div>
</template>
