import type { SensorData } from './types'

export function useMediaDevices() {
  const camera = ref<SensorData>({
    id: 'camera',
    name: '摄像头',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: true,
  })

  const microphone = ref<SensorData>({
    id: 'microphone',
    name: '麦克风',
    status: 'unavailable',
    value: null,
    lastUpdate: 0,
    supportsPermissionAPI: true,
  })

  async function checkPermissions() {
    if ('permissions' in navigator) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        camera.value.permission = cameraPermission.state

        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        microphone.value.permission = micPermission.state
      }
      catch (error) {
        console.error('Permission check error:', error)
      }
    }
  }

  async function start() {
    if (!('mediaDevices' in navigator)) {
      camera.value.error = '浏览器不支持MediaDevices API'
      microphone.value.error = '浏览器不支持MediaDevices API'
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      const audioDevices = devices.filter(device => device.kind === 'audioinput')

      camera.value.status = videoDevices.length > 0 ? 'available' : 'unavailable'
      camera.value.value = { count: videoDevices.length }
      camera.value.lastUpdate = Date.now()

      microphone.value.status = audioDevices.length > 0 ? 'available' : 'unavailable'
      microphone.value.value = { count: audioDevices.length }
      microphone.value.lastUpdate = Date.now()
    }
    catch {
      camera.value.status = 'error'
      microphone.value.status = 'error'
      camera.value.error = '无法枚举媒体设备'
      microphone.value.error = '无法枚举媒体设备'
    }
  }

  async function requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      camera.value.status = 'available'
      camera.value.permission = 'granted'
      await start()
    }
    catch (error: any) {
      camera.value.status = 'permission-needed'
      camera.value.error = error.name === 'NotAllowedError' ? '用户拒绝了摄像头权限' : '无法访问摄像头'
    }
  }

  async function requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      microphone.value.status = 'available'
      microphone.value.permission = 'granted'
      await start()
    }
    catch (error: any) {
      microphone.value.status = 'permission-needed'
      microphone.value.error = error.name === 'NotAllowedError' ? '用户拒绝了麦克风权限' : '无法访问麦克风'
    }
  }

  onMounted(() => {
    checkPermissions()
  })

  return {
    camera,
    microphone,
    start,
    requestCameraPermission,
    requestMicrophonePermission,
  }
}
