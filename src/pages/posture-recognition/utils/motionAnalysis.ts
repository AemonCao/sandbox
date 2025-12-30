import type { Direction } from '../composables/types'

/**
 * 计算三轴加速度的合成幅值
 * @param x - X轴加速度
 * @param y - Y轴加速度
 * @param z - Z轴加速度
 * @returns 加速度幅值
 */
export function calculateMagnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}

/**
 * 移动平均滤波器
 * @param data - 输入数据数组
 * @param windowSize - 窗口大小
 * @returns 滤波后的数据数组
 */
export function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = data.slice(start, i + 1)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(avg)
  }
  return result
}

/**
 * 计算数据方差
 * @param data - 输入数据数组
 * @returns 方差值
 */
export function calculateVariance(data: number[]): number {
  if (data.length === 0)
    return 0
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const squaredDiffs = data.map(val => (val - mean) ** 2)
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length
}

/**
 * 峰值检测算法
 * @param data - 输入数据数组
 * @param threshold - 峰值阈值
 * @param minDistance - 最小峰值间距
 * @returns 峰值索引数组
 */
export function detectPeaks(data: number[], threshold: number, minDistance: number): number[] {
  const peaks: number[] = []
  for (let i = 1; i < data.length - 1; i++) {
    // 检查是否为局部最大值
    if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
      // 检查与上一个峰值的距离
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i)
      }
    }
  }
  return peaks
}

/**
 * 计算步频（Hz）
 * @param peaks - 峰值索引数组
 * @param timeWindow - 时间窗口（秒）
 * @returns 步频（Hz）
 */
export function calculateStepFrequency(peaks: number[], timeWindow: number): number {
  if (peaks.length < 2)
    return 0
  return peaks.length / timeWindow
}

/**
 * 方向角度转换为方位
 * @param alpha - 罗盘方向角度 (0-360°)
 * @returns 方位
 */
export function angleToDirection(alpha: number): Direction {
  // 归一化角度到 0-360
  const normalized = ((alpha % 360) + 360) % 360

  if (normalized >= 337.5 || normalized < 22.5)
    return 'north'
  if (normalized >= 22.5 && normalized < 67.5)
    return 'northeast'
  if (normalized >= 67.5 && normalized < 112.5)
    return 'east'
  if (normalized >= 112.5 && normalized < 157.5)
    return 'southeast'
  if (normalized >= 157.5 && normalized < 202.5)
    return 'south'
  if (normalized >= 202.5 && normalized < 247.5)
    return 'southwest'
  if (normalized >= 247.5 && normalized < 292.5)
    return 'west'
  if (normalized >= 292.5 && normalized < 337.5)
    return 'northwest'

  return 'stationary'
}

/**
 * 应用滞后效应防止方向抖动
 * @param currentDirection - 当前方向
 * @param newAlpha - 新的角度
 * @param hysteresis - 滞后角度
 * @returns 更新后的方向
 */
export function applyHysteresis(currentDirection: Direction, newAlpha: number, hysteresis: number): Direction {
  if (currentDirection === 'stationary')
    return angleToDirection(newAlpha)

  const newDirection = angleToDirection(newAlpha)
  if (newDirection === currentDirection)
    return currentDirection

  // 计算方向对应的中心角度
  const directionAngles: Record<Direction, number> = {
    north: 0,
    northeast: 45,
    east: 90,
    southeast: 135,
    south: 180,
    southwest: 225,
    west: 270,
    northwest: 315,
    stationary: 0,
  }

  const currentAngle = directionAngles[currentDirection]
  const normalized = ((newAlpha % 360) + 360) % 360

  // 计算角度差（考虑360度循环）
  let diff = Math.abs(normalized - currentAngle)
  if (diff > 180)
    diff = 360 - diff

  // 如果角度差小于滞后阈值，保持当前方向
  if (diff < hysteresis)
    return currentDirection

  return newDirection
}
