import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  routes: setupLayouts(routes),
  history: createWebHashHistory(import.meta.env.BASE_URL),
})

router.beforeEach(async (_to, _from) => {
  return true
})

export { router }
