<script setup lang="ts">
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream>()
const isActive = ref(false)

async function startPreview() {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      isActive.value = true
    }
  }
  catch (error) {
    console.error('Failed to start camera preview:', error)
  }
}

function stopPreview() {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = undefined
  }
  if (videoRef.value)
    videoRef.value.srcObject = null
  isActive.value = false
}

onUnmounted(() => {
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
    <div v-if="isActive" rounded-lg bg-black overflow-hidden>
      <video
        ref="videoRef"
        autoplay playsinline h-auto w-full
      />
    </div>
  </div>
</template>
