<script setup lang="ts">
import type { SimulationParams } from './composables/types'
import { useGUI } from './composables/useGUI'
import { useSimulation } from './composables/useSimulation'

const isDark = useDark()

const canvasRef = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D
let animationId: number
let lightRemoveTimer: ReturnType<typeof setTimeout> | null = null
const countdown = ref(0)

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
  seekForce: 5,
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

  // 绘制倒计时
  if (countdown.value > 0 && params.lightSeeking) {
    ctx.save()
    ctx.fillStyle = isDark.value ? '#000fff' : '#004fff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(countdown.value.toString(), lightPos.x, lightPos.y)
    ctx.restore()
  }

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

/**
 * 触摸移动事件
 */
function onTouchMove(e: TouchEvent) {
  if (e.touches.length > 0) {
    if (lightRemoveTimer) {
      clearTimeout(lightRemoveTimer)
      lightRemoveTimer = null
    }
    countdown.value = 0
    params.lightSeeking = true
    lightPos.x = e.touches[0].clientX
    lightPos.y = e.touches[0].clientY
  }
}

/**
 * 触摸结束事件
 */
function onTouchEnd() {
  const startTime = Date.now()
  countdown.value = 3

  const updateCountdown = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000))
    countdown.value = remaining

    if (remaining > 0) {
      lightRemoveTimer = setTimeout(updateCountdown, 100)
    }
    else {
      params.lightSeeking = false
      countdown.value = 0
    }
  }

  updateCountdown()
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
  window.addEventListener('touchmove', onTouchMove)
  window.addEventListener('touchend', onTouchEnd)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (lightRemoveTimer) {
    clearTimeout(lightRemoveTimer)
  }
  destroyGUI()
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
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
