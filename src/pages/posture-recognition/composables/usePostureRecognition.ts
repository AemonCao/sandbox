import type { Ref } from 'vue'
import type { PostureParameters, PostureState, PostureType } from './types'
import { angleToDirection, applyHysteresis, calculateMagnitude, calculateStepFrequency, calculateVariance, detectPeaks, movingAverage } from '../utils/motionAnalysis'

/**
 * 姿态识别算法 composable
 * 基于加速度和方位数据推断用户姿态
 */
export function usePostureRecognition(
  acceleration: Ref<{ x: number, y: number, z: number }>,
  orientation: Ref<{ alpha: number, beta: number, gamma: number }>,
  parameters: Ref<PostureParameters>,
) {
  // 当前姿态状态
  const currentPosture = ref<PostureState>({
    type: 'idle',
    direction: 'stationary',
    confidence: 0,
    speed: 0,
    timestamp: Date.now(),
  })

  // 加速度幅值历史
  const magnitudeHistory = ref<number[]>([])

  // 定时器
  let updateTimer: ReturnType<typeof setInterval> | null = null

  /**
   * 分类姿态类型（基于方差和步频）
   */
  function classifyPosture(
    variance: number,
    peakFrequency: number,
  ): PostureType {
    const params = parameters.value

    // 静止：方差很小
    if (variance < params.idleThreshold) {
      return 'idle'
    }

    // 跑步：高方差 + 高频率
    if (variance > params.runningThreshold
      && peakFrequency >= params.runningFreqMin
      && peakFrequency <= params.runningFreqMax) {
      return 'running'
    }

    // 行走：中等方差 + 中等频率
    if (variance > params.walkingThreshold
      && peakFrequency >= params.walkingFreqMin
      && peakFrequency <= params.walkingFreqMax) {
      return 'walking'
    }

    // 站立：有一定方差但没有规律运动
    return 'standing'
  }

  /**
   * 计算置信度
   */
  function calculateConfidence(
    variance: number,
    peakCount: number,
    postureType: PostureType,
  ): number {
    // 基础置信度
    let confidence = 0.5

    // 根据姿态类型调整
    if (postureType === 'idle') {
      // 静止：方差越小置信度越高
      confidence = Math.max(0, 1 - variance / parameters.value.idleThreshold)
    }
    else if (postureType === 'walking' || postureType === 'running') {
      // 行走/跑步：峰值越规律置信度越高
      if (peakCount >= 3) {
        confidence = Math.min(1, 0.6 + peakCount * 0.1)
      }
    }
    else {
      // 站立：中等置信度
      confidence = 0.6
    }

    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * 估算速度
   */
  function estimateSpeed(postureType: PostureType, peakFrequency: number): number {
    if (postureType === 'idle' || postureType === 'standing') {
      return 0
    }
    else if (postureType === 'walking') {
      // 行走速度：1.0-1.5 m/s
      return 1.0 + (peakFrequency - parameters.value.walkingFreqMin) * 0.25
    }
    else if (postureType === 'running') {
      // 跑步速度：2.5-4.0 m/s
      return 2.5 + (peakFrequency - parameters.value.runningFreqMin) * 0.75
    }
    return 0
  }

  /**
   * 更新姿态状态
   */
  function updatePosture() {
    // 计算加速度幅值
    const mag = calculateMagnitude(
      acceleration.value.x,
      acceleration.value.y,
      acceleration.value.z,
    )
    magnitudeHistory.value.push(mag)

    // 保持历史数据在合理范围内
    const maxHistorySize = 100
    if (magnitudeHistory.value.length > maxHistorySize) {
      magnitudeHistory.value.shift()
    }

    // 需要足够的历史数据才能分析
    if (magnitudeHistory.value.length < 20) {
      return
    }

    // 应用移动平均滤波
    const smoothed = movingAverage(
      magnitudeHistory.value,
      parameters.value.movingAverageWindow,
    )

    // 计算方差
    const variance = calculateVariance(smoothed)

    // 计算平均幅值
    const avgMagnitude = smoothed.reduce((sum, val) => sum + val, 0) / smoothed.length

    // 检测峰值（使用动态阈值：平均幅值的 60%）
    const peakThreshold = Math.max(0.5, avgMagnitude * 0.6)
    const peaks = detectPeaks(smoothed, peakThreshold, 5)

    // 计算步频
    const timeWindow = (magnitudeHistory.value.length * 100) / 1000 // 秒
    const peakFrequency = calculateStepFrequency(peaks, timeWindow)

    // 分类姿态
    const postureType = classifyPosture(variance, peakFrequency)

    // 计算置信度
    const confidence = calculateConfidence(variance, peaks.length, postureType)

    // 估算速度
    const speed = estimateSpeed(postureType, peakFrequency)

    // 确定方向
    let direction = angleToDirection(orientation.value.alpha)
    if (postureType === 'idle' || postureType === 'standing') {
      direction = 'stationary'
    }
    else {
      // 应用滞后效应
      direction = applyHysteresis(
        currentPosture.value.direction,
        orientation.value.alpha,
        parameters.value.directionHysteresis,
      )
    }

    // 更新状态
    currentPosture.value = {
      type: postureType,
      direction,
      confidence,
      speed,
      timestamp: Date.now(),
    }
  }

  /**
   * 启动姿态识别
   */
  function start() {
    if (updateTimer)
      return

    updateTimer = setInterval(() => {
      updatePosture()
    }, parameters.value.postureUpdateInterval)
  }

  /**
   * 停止姿态识别
   */
  function stop() {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  }

  // 监听参数变化，动态调整更新间隔
  watch(
    () => parameters.value.postureUpdateInterval,
    (newInterval) => {
      if (updateTimer) {
        stop()
        updateTimer = setInterval(() => {
          updatePosture()
        }, newInterval)
      }
    },
  )

  return {
    currentPosture,
    magnitudeHistory,
    start,
    stop,
  }
}
