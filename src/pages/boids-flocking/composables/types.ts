/**
 * 二维向量类
 */
export class Vec2 {
  constructor(public x = 0, public y = 0) {}

  add(v: Vec2) {
    this.x += v.x
    this.y += v.y
    return this
  }

  sub(v: Vec2) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  mult(n: number) {
    this.x *= n
    this.y *= n
    return this
  }

  div(n: number) {
    this.x /= n
    this.y /= n
    return this
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  setMag(n: number) {
    const m = this.mag()
    if (m > 0) {
      this.mult(n / m)
    }
    return this
  }

  limit(max: number) {
    const m = this.mag()
    if (m > max) {
      this.setMag(max)
    }
    return this
  }

  copy() {
    return new Vec2(this.x, this.y)
  }

  static sub(v1: Vec2, v2: Vec2) {
    return new Vec2(v1.x - v2.x, v1.y - v2.y)
  }

  static random() {
    const angle = Math.random() * Math.PI * 2
    return new Vec2(Math.cos(angle), Math.sin(angle))
  }
}

export interface SimulationParams {
  boidCount: number
  predatorCount: number
  boundaryBehavior: 'bounce' | 'wrap'
  boidColor: ComputedRef<string> | string
  predatorColor: ComputedRef<string> | string
  predatorSize: number
  separation: number
  alignment: number
  cohesion: number
  fleeForce: number
  separationRadius: number
  perceptionRadius: number
  predatorPerceptionRadius: number
  minSpeed: number
  maxSpeed: number
  wallAvoidDistance: number
  wallAvoidForce: number
  lightSeeking: boolean
  seekForce: number
}
