import type { Ref } from 'vue'
import type { SimulationParams } from './types'
import { Boid, Predator } from './agents'

export function useSimulation(
  canvasRef: Ref<HTMLCanvasElement | undefined>,
  params: SimulationParams,
) {
  const boids: Boid[] = []
  const predators: Predator[] = []
  const lightPos = reactive({ x: 0, y: 0 })

  /**
   * 重置模拟
   */
  function resetSimulation() {
    boids.length = 0
    predators.length = 0

    for (let i = 0; i < params.boidCount; i++) {
      boids.push(new Boid(canvasRef, params))
    }
    for (let i = 0; i < params.predatorCount; i++) {
      predators.push(new Predator(canvasRef, params))
    }
  }

  /**
   * 更新模拟
   */
  function updateSimulation() {
    predators.forEach(p => p.update())
    boids.forEach(b => b.update(boids, predators, lightPos, canvasRef, params))
  }

  /**
   * 绘制模拟
   */
  function drawSimulation(ctx: CanvasRenderingContext2D, isDark: boolean) {
    predators.forEach(p => p.draw(ctx, params))
    boids.forEach(b => b.draw(ctx, params))

    // 绘制光源
    if (params.lightSeeking) {
      ctx.fillStyle = isDark ? 'rgba(255, 240, 0, 0.3)' : 'rgba(255, 200, 0, 0.4)'
      ctx.beginPath()
      ctx.arc(lightPos.x, lightPos.y, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = isDark ? '#fff000' : '#ffb000'
      ctx.beginPath()
      ctx.arc(lightPos.x, lightPos.y, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return {
    boids,
    predators,
    lightPos,
    resetSimulation,
    updateSimulation,
    drawSimulation,
  }
}
