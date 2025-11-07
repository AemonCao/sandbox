import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

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

export { router }
