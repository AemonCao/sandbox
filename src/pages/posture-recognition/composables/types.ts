/**
 * 姿态识别相关类型定义
 */

/** 姿态类型 */
export type PostureType = 'standing' | 'walking' | 'running' | 'idle'

/** 方向类型 */
export type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest' | 'stationary'

/** 运动数据结构 */
export interface MotionData {
  /** 加速度数据 */
  acceleration: { x: number, y: number, z: number }
  /** 方位数据 */
  orientation: { alpha: number, beta: number, gamma: number }
  /** 时间戳 */
  timestamp: number
}

/** 姿态识别结果 */
export interface PostureState {
  /** 姿态类型 */
  type: PostureType
  /** 移动方向 */
  direction: Direction
  /** 置信度 (0-1) */
  confidence: number
  /** 估计速度 (m/s) */
  speed: number
  /** 时间戳 */
  timestamp: number
}

/** 传感器指标（用于显示） */
export interface SensorMetric {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 当前值 */
  value: number
  /** 单位 */
  unit: string
  /** 历史数据 */
  history: number[]
  /** 最小值 */
  min: number
  /** 最大值 */
  max: number
}

/** 可调节参数配置 */
export interface PostureParameters {
  /** 移动平均窗口大小 (5-20) */
  movingAverageWindow: number

  /** 静止阈值 (0.1-1.0 m/s²) */
  idleThreshold: number
  /** 行走阈值 (1.0-4.0 m/s²) */
  walkingThreshold: number
  /** 跑步阈值 (6.0-12.0 m/s²) */
  runningThreshold: number

  /** 行走步频下限 (0.3-1.0 Hz) */
  walkingFreqMin: number
  /** 行走步频上限 (1.5-2.5 Hz) */
  walkingFreqMax: number
  /** 跑步步频下限 (1.5-2.5 Hz) */
  runningFreqMin: number
  /** 跑步步频上限 (3.0-5.0 Hz) */
  runningFreqMax: number

  /** 方向滞后角度 (5-20°) */
  directionHysteresis: number

  /** 姿态更新间隔 (200-1000 ms) */
  postureUpdateInterval: number
}

/** 姿态历史记录条目 */
export interface PostureHistoryEntry {
  /** 姿态状态 */
  posture: PostureState
  /** 持续时间 (毫秒) */
  duration: number
}
