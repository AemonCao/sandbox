<script setup lang="ts">
const currentIndex = ref(0)
const label = ref<number | null>(null)
const labels = ref<Uint8Array | null>(null)
const imgData = ref<Uint8Array | null>(null)
const canvasRef = ref<HTMLCanvasElement>()
const debugInfo = ref('')

onMounted(async () => {
  // 加载标签文件
  const response = await fetch('https://iot.ipalmap.com/uploads/data/train-labels-idx1-ubyte')
  const buffer = await response.arrayBuffer()
  const data = new Uint8Array(buffer)
  labels.value = data.slice(8)

  debugInfo.value = `标签文件大小: ${labels.value.length} 个标签\n`
  debugInfo.value += `前10个标签: ${Array.from(labels.value.slice(0, 10)).join(', ')}\n`

  // 加载图片
  const imgResponse = await fetch('https://iot.ipalmap.com/uploads/data/train-images-idx3-ubyte')
  const imgBuffer = await imgResponse.arrayBuffer()
  imgData.value = new Uint8Array(imgBuffer)

  debugInfo.value += `图片数据大小: ${imgData.value.length} 字节\n`

  drawImage()
})

/**
 * 在画布上渲染当前图像
 */
function drawImage() {
  if (!canvasRef.value || !labels.value || !imgData.value)
    return

  const ctx = canvasRef.value.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, 280, 280)

  const imageOffset = 16
  const imageStart = imageOffset + currentIndex.value * 784

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = 28
  tempCanvas.height = 28
  const tempCtx = tempCanvas.getContext('2d')!
  const imageData = tempCtx.createImageData(28, 28)

  for (let i = 0; i < 784; i++) {
    const val = imgData.value[imageStart + i]
    const idx = i * 4
    imageData.data[idx] = val
    imageData.data[idx + 1] = val
    imageData.data[idx + 2] = val
    imageData.data[idx + 3] = 255
  }

  tempCtx.putImageData(imageData, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, 28, 28, 0, 0, 280, 280)

  let minVal = 255
  let maxVal = 0
  let sum = 0
  for (let i = 0; i < 784; i++) {
    const val = imgData.value[imageStart + i]
    minVal = Math.min(minVal, val)
    maxVal = Math.max(maxVal, val)
    sum += val
  }
  const avg = sum / 784

  debugInfo.value = `标签文件大小: ${labels.value.length} 个标签\n`
  debugInfo.value += `当前图片像素值 - 最小: ${minVal}, 最大: ${maxVal}, 平均: ${avg.toFixed(2)}\n`
  debugInfo.value += `前10个像素: ${Array.from(imgData.value.slice(imageStart, imageStart + 10)).join(', ')}`

  label.value = labels.value[currentIndex.value]
}

/**
 * 显示上一张图像
 */
function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    drawImage()
  }
}

/**
 * 显示下一张图像
 */
function next() {
  if (labels.value && currentIndex.value < labels.value.length - 1) {
    currentIndex.value++
    drawImage()
  }
}

/**
 * 跳转到指定索引的图像
 */
function jump() {
  drawImage()
}
</script>

<template>
  <div p-4 min-h-screen from-blue-50 to-indigo-100 bg-gradient-to-br dark:from-gray-900 dark:to-blue-900>
    <div mb-6>
      <h1 text-3xl font-bold text-center dark:text-white>
        MNIST 数据集预览
      </h1>
      <p text-gray-600 mt-2 text-center dark:text-gray-300>
        查看训练集图片和标签是否正确
      </p>
    </div>

    <div mx-auto p-6 rounded-lg bg-white max-w-2xl shadow-lg dark:bg-gray-800 dark:shadow-gray-700>
      <div flex flex-col gap-6 items-center>
        <!-- 画布 -->
        <canvas
          ref="canvasRef"
          width="280"
          height="280"
          border="2 solid gray-300 dark:border-gray-600"
          rounded-lg
        />

        <!-- 标签显示 -->
        <div text-center>
          <div text-sm text-gray-600 dark:text-gray-400>
            当前标签
          </div>
          <div text-4xl text-blue-600 font-bold dark:text-blue-400>
            {{ label ?? '-' }}
          </div>
        </div>

        <!-- 索引控制 -->
        <div flex gap-4 w-full items-center>
          <n-button :disabled="currentIndex === 0" @click="prev">
            上一张
          </n-button>

          <div flex flex-1 gap-2 items-center>
            <n-input-number
              v-model:value="currentIndex"
              :min="0"
              :max="labels ? labels.length - 1 : 0"
              style="flex: 1"
            />
            <n-button @click="jump">
              跳转
            </n-button>
          </div>

          <n-button :disabled="!labels || currentIndex >= labels.length - 1" @click="next">
            下一张
          </n-button>
        </div>

        <!-- 信息显示 -->
        <div text-sm text-gray-600 text-center dark:text-gray-400>
          <div>当前索引: {{ currentIndex }}</div>
          <div v-if="labels">
            总数: {{ labels.length }}
          </div>
        </div>

        <!-- 调试信息 -->
        <div text-xs font-mono p-4 rounded bg-gray-100 w-full whitespace-pre-wrap dark:text-gray-200 dark:bg-gray-700>
          {{ debugInfo }}
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: 'MNIST数据预览'
</route>
