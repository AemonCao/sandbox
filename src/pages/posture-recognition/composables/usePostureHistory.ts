import type { Ref } from 'vue'
import type { PostureHistoryEntry, PostureState, PostureType } from './types'

/**
 * 姿态历史追踪 composable
 * 追踪姿态变化和统计数据
 */
export function usePostureHistory(currentPosture: Ref<PostureState>) {
  // 历史记录（最近 50 条）
  const history = ref<PostureHistoryEntry[]>([])

  // 统计数据（今日各姿态时长，毫秒）
  const statistics = ref<Record<PostureType, number>>({
    idle: 0,
    standing: 0,
    walking: 0,
    running: 0,
  })

  // 上一次姿态
  let lastPosture: PostureState | null = null
  let lastChangeTime = Date.now()

  /**
   * 更新历史记录
   */
  function updateHistory() {
    const current = currentPosture.value

    // 首次记录
    if (!lastPosture) {
      lastPosture = { ...current }
      lastChangeTime = Date.now()
      return
    }

    // 检查姿态是否变化
    if (current.type !== lastPosture.type) {
      const now = Date.now()
      const duration = now - lastChangeTime

      // 添加到历史记录
      history.value.push({
        posture: { ...lastPosture },
        duration,
      })

      // 更新统计数据
      statistics.value[lastPosture.type] += duration

      // 保持历史记录在 50 条以内
      if (history.value.length > 50) {
        history.value.shift()
      }

      // 更新状态
      lastPosture = { ...current }
      lastChangeTime = now
    }
  }

  /**
   * 清空历史记录
   */
  function clearHistory() {
    history.value = []
    statistics.value = {
      idle: 0,
      standing: 0,
      walking: 0,
      running: 0,
    }
    lastPosture = null
    lastChangeTime = Date.now()
  }

  /**
   * 获取格式化的统计数据
   */
  const formattedStatistics = computed(() => {
    const total = Object.values(statistics.value).reduce((sum, val) => sum + val, 0)
    if (total === 0)
      return []

    return Object.entries(statistics.value).map(([type, duration]) => ({
      type: type as PostureType,
      duration,
      percentage: (duration / total) * 100,
      formattedDuration: formatDuration(duration),
    }))
  })

  /**
   * 格式化持续时间
   */
  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    else {
      return `${seconds}s`
    }
  }

  // 监听姿态变化
  watch(currentPosture, updateHistory, { deep: true })

  return {
    history,
    statistics,
    formattedStatistics,
    clearHistory,
  }
}
