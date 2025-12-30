import type { PostureParameters } from './types'

/** 默认参数配置 */
export const DEFAULT_PARAMETERS: PostureParameters = {
  movingAverageWindow: 10,
  idleThreshold: 0.5, // 方差阈值
  walkingThreshold: 1.5, // 方差阈值（不是幅值）
  runningThreshold: 3.0, // 方差阈值（不是幅值）
  walkingFreqMin: 0.5,
  walkingFreqMax: 2.0,
  runningFreqMin: 2.0,
  runningFreqMax: 4.0,
  directionHysteresis: 10,
  postureUpdateInterval: 500,
}

/** 采样间隔 (ms) - 固定 */
export const SAMPLE_INTERVAL = 100

/** 最大历史点数 - 固定 */
export const MAX_HISTORY_POINTS = 100

/** 历史持续时间 (秒) */
export const HISTORY_DURATION = (MAX_HISTORY_POINTS * SAMPLE_INTERVAL) / 1000
