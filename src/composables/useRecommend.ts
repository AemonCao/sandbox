/**
 * 推荐功能 composable
 *
 * 基于用户点击行为和标签热度，对带有 path/tags 的条目进行智能排序。
 * 数据通过 localStorage 持久化，可跨页面复用。
 */

export interface RecommendableItem {
  path: string
  meta: {
    tags?: string[]
    [key: string]: any
  }
}

/**
 * 创建推荐功能实例
 * @param storagePrefix - localStorage 键名前缀，用于隔离不同场景的数据
 */
export function useRecommend(storagePrefix = 'sandbox') {
  // 推荐模式开关
  const isRecommendMode = useStorage(`${storagePrefix}-recommend-mode`, false)

  // 路由点击计数：path -> count
  const clickCounts = useStorage<Record<string, number>>(`${storagePrefix}-route-clicks`, {})

  // 标签热度计数：tag -> count
  const tagPopularity = useStorage<Record<string, number>>(`${storagePrefix}-tag-popularity`, {})

  /**
   * 记录一次条目点击，递增点击计数和相关标签热度
   * @param item - 被点击的条目
   */
  function recordClick(item: RecommendableItem) {
    clickCounts.value[item.path] = (clickCounts.value[item.path] || 0) + 1
    item.meta.tags?.forEach((tag) => {
      tagPopularity.value[tag] = (tagPopularity.value[tag] || 0) + 1
    })
  }

  /**
   * 计算条目的标签热度总分
   * @param item - 目标条目
   * @returns 该条目所有标签的热度之和
   */
  function getTagScore(item: RecommendableItem): number {
    if (!item.meta.tags)
      return 0
    return item.meta.tags.reduce((sum, tag) => sum + (tagPopularity.value[tag] || 0), 0)
  }

  /**
   * 对条目列表按推荐逻辑排序（不修改原数组）
   * 排序规则：先按点击次数降序，再按标签热度降序
   * @param items - 待排序的条目列表
   * @returns 排序后的新数组
   */
  function sortByRecommend<T extends RecommendableItem>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const clickDiff = (clickCounts.value[b.path] || 0) - (clickCounts.value[a.path] || 0)
      if (clickDiff !== 0)
        return clickDiff
      return getTagScore(b) - getTagScore(a)
    })
  }

  /**
   * 清除所有推荐数据，重置为初始状态
   */
  function clearAll() {
    isRecommendMode.value = false
    clickCounts.value = {}
    tagPopularity.value = {}
  }

  return {
    isRecommendMode,
    clickCounts,
    tagPopularity,
    recordClick,
    getTagScore,
    sortByRecommend,
    clearAll,
  }
}
