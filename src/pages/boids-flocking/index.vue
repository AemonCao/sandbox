<script setup lang="ts">
import type { SimulationParams } from './composables/types'
import { useGUI } from './composables/useGUI'
import { useSimulation } from './composables/useSimulation'

const isDark = useDark()

const canvasRef = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D
let animationId: number

const params = reactive<SimulationParams>({
  boidCount: 150,
  predatorCount: 2,
  boundaryBehavior: 'bounce',
  boidColor: computed(() => isDark.value ? '#ffffff' : '#333333'),
  predatorColor: computed(() => isDark.value ? '#ff4444' : '#ff0000'),
  predatorSize: 8,
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
  fleeForce: 5.0,
  separationRadius: 25,
  perceptionRadius: 50,
  predatorPerceptionRadius: 80,
  minSpeed: 2.0,
  maxSpeed: 4.0,
  wallAvoidDistance: 20,
  wallAvoidForce: 5.0,
  lightSeeking: true,
  seekForce: 1.2,
})

const {
  lightPos,
  resetSimulation,
  updateSimulation,
  drawSimulation,
} = useSimulation(canvasRef, params)

const { initGUI, destroyGUI } = useGUI(params, resetSimulation, isDark)

/**
 * 动画循环
 */
function animate() {
  if (!ctx)
    return

  ctx.fillStyle = isDark.value ? '#111' : '#f5f5f5'
  ctx.fillRect(0, 0, canvasRef.value!.width, canvasRef.value!.height)

  updateSimulation()
  drawSimulation(ctx, isDark.value)

  animationId = requestAnimationFrame(animate)
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
  if (!canvasRef.value)
    return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
}

/**
 * 鼠标移动事件
 */
function onMouseMove(e: MouseEvent) {
  lightPos.x = e.clientX
  lightPos.y = e.clientY
}

onMounted(() => {
  if (!canvasRef.value)
    return

  ctx = canvasRef.value.getContext('2d')!
  resizeCanvas()

  lightPos.x = window.innerWidth / 2
  lightPos.y = window.innerHeight / 2

  initGUI()
  resetSimulation()
  animate()

  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  destroyGUI()
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <canvas ref="canvasRef" inset-0 fixed />
</template>

<style scoped>
canvas {
  display: block;
  cursor: crosshair;
}
</style>

<route lang="yaml">
meta:
  layout: default
  title: '鸟群算法'
  description: 'Boids 鸟群算法模拟，展示分离、对齐、聚集三大规则的群体智能行为'
  tags: ['算法', 'Canvas', '可视化']
</route>
