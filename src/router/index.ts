import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useRecommend } from '~/composables/useRecommend'

// 根据环境选择路由模式：开发环境使用 history，生产环境使用 hash
const isDev = import.meta.env.DEV
const history = isDev
  ? createWebHistory(import.meta.env.BASE_URL)
  : createWebHashHistory(import.meta.env.BASE_URL)

const router = createRouter({
  routes: setupLayouts([...routes]),
  history,
})

router.beforeEach(async (_to, _from) => {
  return true
})

// 初始化推荐功能（useStorage 在组件外可正常工作）
const { recordClick } = useRecommend()

/**
 * 导航完成后记录页面访问，用于推荐排序
 * 跳过首页和 404 页面
 */
router.afterEach((to) => {
  // 跳过首页
  if (to.path === '/')
    return
  // 跳过 404 catch-all 路由
  if (!to.name || String(to.name).includes('[...all]'))
    return

  recordClick({
    path: to.path,
    meta: { tags: to.meta.tags },
  })
})

export { router }
