<script setup lang="ts">
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const isActive = ref(false)
const message = useMessage()
const devices = ref<MediaDeviceInfo[]>([])
const currentDeviceId = ref<string>()

async function loadDevices() {
  const allDevices = await navigator.mediaDevices.enumerateDevices()
  devices.value = allDevices.filter(d => d.kind === 'videoinput')
  if (devices.value.length > 0 && !currentDeviceId.value)
    currentDeviceId.value = devices.value[0].deviceId
}

async function startPreview() {
  try {
    await loadDevices()
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: currentDeviceId.value ? { deviceId: currentDeviceId.value } : true,
    })
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

async function switchCamera(deviceId: string) {
  currentDeviceId.value = deviceId
  if (isActive.value) {
    stopPreview()
    await startPreview()
  }
}

const currentDeviceName = computed(() =>
  devices.value.find(d => d.deviceId === currentDeviceId.value)?.label || '未知摄像头',
)

onBeforeUnmount(() => {
  stopPreview()
})
</script>

<template>
  <div mt-4 space-y-2>
    <div flex gap-2 items-center>
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
      <select
        v-if="devices.length > 1"
        v-model="currentDeviceId"
        text-xs px-2 py-1 border rounded
        @change="switchCamera(currentDeviceId!)"
      >
        <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label || `摄像头 ${devices.indexOf(device) + 1}` }}
        </option>
      </select>
      <span v-if="isActive" text-xs text-gray-600>{{ currentDeviceName }}</span>
    </div>
    <div rounded-lg bg-black overflow-hidden>
      <video
        ref="videoRef"
        autoplay playsinline min-h-48 w-full
      />
    </div>
  </div>
</template>
