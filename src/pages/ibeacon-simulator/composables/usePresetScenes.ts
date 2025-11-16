import { ref } from 'vue'
import { presetScenes } from '~/data/presets'

export interface PresetScene {
  name: string
  description?: string
  beacons: Array<{
    id: number
    type: 'beacon'
    x: number
    y: number
    z: number
    txPower: number
  }>
  clients: Array<{
    id: number
    type: 'client'
    x: number
    y: number
    z: number
  }>
  settings: {
    scale: number
    beaconHeight: number
    clientHeight: number
    beaconN: number
    clientRssiThreshold: number
    showCoverageArea: boolean
    coverageStep: number
  }
}

export function usePresetScenes() {
  const scenes = ref(presetScenes)

  function loadPresetScene(
    sceneType: string,
    callbacks: {
      clearAll: () => void
      setBeacons: (beacons: any[]) => void
      setClients: (clients: any[]) => void
      setScale: (scale: number) => void
      setBeaconHeight: (height: number) => void
      setClientHeight: (height: number) => void
      setBeaconN: (n: number) => void
      setClientRssiThreshold: (threshold: number) => void
      setShowCoverageArea: (show: boolean) => void
      setCoverageStep: (step: number) => void
      centerScene: () => void
      showSuccess: (message: string) => void
      showError: (message: string) => void
    },
  ): void {
    try {
      const scene = scenes.value[sceneType as keyof typeof scenes.value]

      if (!scene) {
        callbacks.showError('预设场景不存在')
        return
      }

      // 清空当前场景
      callbacks.clearAll()

      // 加载预设场景
      callbacks.setBeacons([...scene.beacons])
      callbacks.setClients([...scene.clients])

      // 应用设置
      callbacks.setScale(scene.settings.scale)
      callbacks.setBeaconHeight(scene.settings.beaconHeight)
      callbacks.setClientHeight(scene.settings.clientHeight)
      callbacks.setBeaconN(scene.settings.beaconN)
      callbacks.setClientRssiThreshold(scene.settings.clientRssiThreshold)
      callbacks.setShowCoverageArea(scene.settings.showCoverageArea)
      callbacks.setCoverageStep(scene.settings.coverageStep)

      callbacks.centerScene()

      callbacks.showSuccess(`已加载${scene.name}预设场景`)
    }
    catch (error) {
      console.error('加载预设场景失败:', error)
      callbacks.showError('加载预设场景失败，请重试')
    }
  }

  return {
    scenes,
    loadPresetScene,
  }
}
