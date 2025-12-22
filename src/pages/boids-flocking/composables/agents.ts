import type { Ref } from 'vue'
import type { SimulationParams } from './types'
import { Vec2 } from './types'

/**
 * 智能体基类
 */
export class Agent {
  pos: Vec2
  vel: Vec2
  acc: Vec2
  maxForce = 0.05

  constructor(
    private canvasRef: Ref<HTMLCanvasElement | undefined>,
    private params: SimulationParams,
  ) {
    const w = canvasRef.value!.width
    const h = canvasRef.value!.height
    this.pos = new Vec2(Math.random() * w, Math.random() * h)
    this.vel = Vec2.random().setMag(Math.random() * (params.maxSpeed - params.minSpeed) + params.minSpeed)
    this.acc = new Vec2()
  }

  applyForce(force: Vec2) {
    this.acc.add(force)
  }

  checkBounds() {
    const w = this.canvasRef.value!.width
    const h = this.canvasRef.value!.height

    if (this.params.boundaryBehavior === 'wrap') {
      if (this.pos.x > w)
        this.pos.x = 0
      else if (this.pos.x < 0)
        this.pos.x = w
      if (this.pos.y > h)
        this.pos.y = 0
      else if (this.pos.y < 0)
        this.pos.y = h
    }
    else {
      const d = -0.9
      if (this.pos.x > w) {
        this.pos.x = w
        this.vel.x *= d
      }
      else if (this.pos.x < 0) {
        this.pos.x = 0
        this.vel.x *= d
      }
      if (this.pos.y > h) {
        this.pos.y = h
        this.vel.y *= d
      }
      else if (this.pos.y < 0) {
        this.pos.y = 0
        this.vel.y *= d
      }
    }
  }
}

/**
 * 鸟类智能体
 */
export class Boid extends Agent {
  maxSpeed: number

  constructor(
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    params: SimulationParams,
  ) {
    super(canvasRef, params)
    this.maxSpeed = params.maxSpeed
  }

  /**
   * 寻找目标
   */
  seek(target: Vec2) {
    const desired = Vec2.sub(target, this.pos).setMag(this.maxSpeed)
    const steer = Vec2.sub(desired, this.vel).limit(this.maxForce)
    return steer
  }

  /**
   * 避开墙壁
   */
  avoidWalls(canvasRef: Ref<HTMLCanvasElement | undefined>, params: SimulationParams) {
    const steer = new Vec2()
    const d = params.wallAvoidDistance
    const w = canvasRef.value!.width
    const h = canvasRef.value!.height

    if (this.pos.x < d)
      steer.x = 1
    else if (this.pos.x > w - d)
      steer.x = -1
    if (this.pos.y < d)
      steer.y = 1
    else if (this.pos.y > h - d)
      steer.y = -1

    if (steer.mag() > 0) {
      steer.setMag(this.maxSpeed)
      steer.sub(this.vel)
      steer.limit(this.maxForce * 2)
    }
    return steer
  }

  /**
   * 逃离天敌
   */
  flee(predators: Predator[], params: SimulationParams) {
    const steer = new Vec2()
    let total = 0

    for (const p of predators) {
      const dist = Vec2.sub(this.pos, p.pos).mag()
      if (dist < params.predatorPerceptionRadius) {
        const diff = Vec2.sub(this.pos, p.pos).div(dist * dist)
        steer.add(diff)
        total++
      }
    }

    if (total > 0) {
      steer.div(total).setMag(this.maxSpeed)
      steer.sub(this.vel).limit(this.maxForce * 2)
    }
    return steer
  }

  /**
   * 分离规则
   */
  separate(boids: Boid[], params: SimulationParams) {
    const steer = new Vec2()
    let total = 0

    for (const other of boids) {
      const dist = Vec2.sub(this.pos, other.pos).mag()
      if (other !== this && dist < params.separationRadius) {
        const diff = Vec2.sub(this.pos, other.pos).div(dist * dist)
        steer.add(diff)
        total++
      }
    }

    if (total > 0) {
      steer.div(total).setMag(this.maxSpeed)
      steer.sub(this.vel).limit(this.maxForce)
    }
    return steer
  }

  /**
   * 对齐规则
   */
  align(boids: Boid[], params: SimulationParams) {
    const steer = new Vec2()
    let total = 0

    for (const other of boids) {
      const dist = Vec2.sub(this.pos, other.pos).mag()
      if (other !== this && dist < params.perceptionRadius) {
        steer.add(other.vel)
        total++
      }
    }

    if (total > 0) {
      steer.div(total).setMag(this.maxSpeed)
      steer.sub(this.vel).limit(this.maxForce)
    }
    return steer
  }

  /**
   * 聚集规则
   */
  cohere(boids: Boid[], params: SimulationParams) {
    const steer = new Vec2()
    let total = 0

    for (const other of boids) {
      const dist = Vec2.sub(this.pos, other.pos).mag()
      if (other !== this && dist < params.perceptionRadius) {
        steer.add(other.pos)
        total++
      }
    }

    if (total > 0) {
      steer.div(total).sub(this.pos).setMag(this.maxSpeed)
      steer.sub(this.vel).limit(this.maxForce)
    }
    return steer
  }

  /**
   * 群体行为
   */
  flock(
    boids: Boid[],
    predators: Predator[],
    lightPos: { x: number, y: number },
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    params: SimulationParams,
  ) {
    if (params.boundaryBehavior === 'bounce') {
      this.applyForce(this.avoidWalls(canvasRef, params).mult(params.wallAvoidForce))
    }

    const fleeing = this.flee(predators, params).mult(params.fleeForce)
    if (fleeing.mag() > 0) {
      this.applyForce(fleeing)
    }
    else {
      if (params.lightSeeking) {
        this.applyForce(this.seek(new Vec2(lightPos.x, lightPos.y)).mult(params.seekForce))
      }
      this.applyForce(this.separate(boids, params).mult(params.separation))
      this.applyForce(this.align(boids, params).mult(params.alignment))
      this.applyForce(this.cohere(boids, params).mult(params.cohesion))
    }
  }

  update(
    boids: Boid[],
    predators: Predator[],
    lightPos: { x: number, y: number },
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    params: SimulationParams,
  ) {
    this.flock(boids, predators, lightPos, canvasRef, params)
    this.vel.add(this.acc)
    this.vel.limit(params.maxSpeed)
    if (this.vel.mag() < params.minSpeed) {
      this.vel.setMag(params.minSpeed)
    }
    this.pos.add(this.vel)
    this.acc.mult(0)
    this.checkBounds()
  }

  draw(ctx: CanvasRenderingContext2D, params: SimulationParams) {
    const angle = Math.atan2(this.vel.y, this.vel.x)
    ctx.save()
    ctx.translate(this.pos.x, this.pos.y)
    ctx.rotate(angle)
    ctx.fillStyle = unref(params.boidColor)
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(-4, 4)
    ctx.lineTo(-4, -4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

/**
 * 天敌智能体
 */
export class Predator extends Agent {
  constructor(
    canvasRef: Ref<HTMLCanvasElement | undefined>,
    params: SimulationParams,
  ) {
    super(canvasRef, params)
    this.vel.setMag(params.maxSpeed * 1.2)
  }

  update() {
    this.pos.add(this.vel)
    this.checkBounds()
  }

  draw(ctx: CanvasRenderingContext2D, params: SimulationParams) {
    ctx.fillStyle = unref(params.predatorColor)
    ctx.beginPath()
    ctx.arc(this.pos.x, this.pos.y, params.predatorSize, 0, Math.PI * 2)
    ctx.fill()
  }
}
