<script setup lang="ts">
import type { NoiseParams, TerrainParams, VisualParams } from '../composables/types'
import { useTerrainGenerator } from '../composables/useTerrainGenerator'
import { useThreeScene } from '../composables/useThreeScene'

interface Props {
  noiseParams: NoiseParams
  terrainParams: TerrainParams
  visualParams: VisualParams
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement>()
let sceneManager: ReturnType<typeof useThreeScene> | null = null

/**
 * 初始化场景
 */
function initScene() {
  if (!canvasRef.value)
    return

  sceneManager = useThreeScene(canvasRef.value)
  sceneManager.initScene()

  // 生成初始地形
  generateTerrain()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

/**
 * 生成地形
 */
function generateTerrain() {
  if (!sceneManager)
    return

  const { generateTerrain } = useTerrainGenerator()

  const terrain = generateTerrain(
    props.noiseParams,
    props.terrainParams,
    props.visualParams.colorScheme,
  )

  sceneManager.updateTerrain(terrain, props.visualParams.displayMode)
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  sceneManager?.handleResize()
}

/**
 * 监听参数变化
 */
watch(
  () => [props.noiseParams, props.terrainParams, props.visualParams],
  () => {
    generateTerrain()
  },
  { deep: true },
)

onMounted(() => {
  nextTick(() => {
    initScene()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  sceneManager?.dispose()
})
</script>

<template>
  <div h-full w-full>
    <canvas ref="canvasRef" h-full w-full />
  </div>
</template>
