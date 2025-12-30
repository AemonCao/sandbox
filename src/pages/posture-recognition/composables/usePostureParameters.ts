import type { PostureParameters } from './types'
import { DEFAULT_PARAMETERS } from './usePostureConfig'

const STORAGE_KEY = 'posture-params'

/**
 * 参数管理 composable
 * 管理姿态识别的可调节参数
 */
export function usePostureParameters() {
  // 从 localStorage 加载参数，如果不存在则使用默认值
  const loadParameters = (): PostureParameters => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // 合并默认参数，确保所有字段都存在
        return { ...DEFAULT_PARAMETERS, ...parsed }
      }
    }
    catch (error) {
      console.warn('Failed to load parameters from localStorage:', error)
    }
    return { ...DEFAULT_PARAMETERS }
  }

  // 响应式参数状态
  const parameters = ref<PostureParameters>(loadParameters())

  /**
   * 重置为默认值
   */
  function reset() {
    parameters.value = { ...DEFAULT_PARAMETERS }
  }

  /**
   * 更新单个参数
   */
  function updateParameter<K extends keyof PostureParameters>(
    key: K,
    value: PostureParameters[K],
  ) {
    parameters.value[key] = value
  }

  // 监听参数变化，持久化到 localStorage
  watch(
    parameters,
    (newParams) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newParams))
      }
      catch (error) {
        console.warn('Failed to save parameters to localStorage:', error)
      }
    },
    { deep: true },
  )

  return {
    parameters,
    reset,
    updateParameter,
  }
}
