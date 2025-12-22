/**
 * 传感器数据采集的全局配置
 * 所有传感器共享这些配置以确保数据同步和图表稳定
 */
export const SAMPLE_INTERVAL = 100 // 采样间隔：100ms（每秒更新10次）
export const HISTORY_DURATION = 10000 // 历史时长：10秒
export const MAX_HISTORY_POINTS = Math.floor(HISTORY_DURATION / SAMPLE_INTERVAL) // 最大历史点数：100个点
