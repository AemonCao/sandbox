<script setup lang="ts">
import type { EulerAnglesState, GimbalStatus, SceneTheme } from '~/pages/euler-gimbal-lock/composables/types'
import { createAxisDiagnosticScene } from '~/pages/euler-gimbal-lock/composables/useGimbalScenes'

interface Props {
  angles: EulerAnglesState
  status: GimbalStatus
  theme: SceneTheme
}

const props = defineProps<Props>()

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
let scene: ReturnType<typeof createAxisDiagnosticScene> | null = null

function initScene() {
  if (!canvasRef.value)
    return

  scene = createAxisDiagnosticScene(canvasRef.value)
  scene.init()
  scene.update(props.angles, props.status, props.theme)
}

useResizeObserver(containerRef, () => {
  scene?.handleResize()
})

watch(
  () => [props.angles, props.status, props.theme],
  () => {
    scene?.update(props.angles, props.status, props.theme)
  },
  { deep: true },
)

onMounted(() => {
  nextTick(() => {
    initScene()
  })
})

onUnmounted(() => {
  scene?.dispose()
})
</script>

<template>
  <div ref="containerRef" rounded-2xl h-full min-h-72 w-full relative overflow-hidden>
    <canvas ref="canvasRef" h-full w-full />
  </div>
</template>
