<script setup lang="ts">
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const isActive = ref(false)
const message = useMessage()

async function startPreview() {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      await videoRef.value.play()
      isActive.value = true
    }
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误'
    console.error('Failed to start camera preview:', error)
    message.error(`摄像头启动失败: ${msg}`)
  }
}

function stopPreview() {
  if (videoRef.value)
    videoRef.value.srcObject = null
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  isActive.value = false
}

onBeforeUnmount(() => {
  stopPreview()
})
</script>

<template>
  <div mt-4 space-y-2>
    <div flex gap-2>
      <button
        text-xs text-white px-3 py-1 rounded bg-blue-500 transition-colors hover:bg-blue-600
        :disabled="isActive"
        @click="startPreview"
      >
        开启预览
      </button>
      <button
        text-xs text-white px-3 py-1 rounded bg-gray-500 transition-colors hover:bg-gray-600
        :disabled="!isActive"
        @click="stopPreview"
      >
        关闭预览
      </button>
    </div>
    <div rounded-lg bg-black overflow-hidden>
      <video
        ref="videoRef"
        autoplay playsinline min-h-48 w-full
      />
    </div>
  </div>
</template>
