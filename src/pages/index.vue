<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { NButton, NCard, NGi, NGrid, NSpace } from 'naive-ui'
import { routes } from 'vue-router/auto-routes'

defineOptions({
  name: 'IndexPage',
})

interface RouteInfo {
  path: string
  name: string
  meta: {
    title?: string
    description?: string
    layout?: string
    menu?: {
      title?: string
      navSort?: number
      icon?: string
      isBig?: boolean
    }
  }
}

// 扁平化路由，获取所有有效的页面路由
const pageRoutes: RouteInfo[] = []

/**
 * 扁平化并提取所有有效的页面路由
 *
 * @param {readonly RouteRecordRaw[]} routeList 路由列表
 */
function extractRoutes(routeList: readonly RouteRecordRaw[]) {
  routeList.forEach((route: any) => {
    // 处理有children的路由（通常是布局路由）
    if (route.children) {
      route.children.forEach((child: any) => {
        // 如果child还有children，说明这是嵌套的页面结构
        if (child.children) {
          child.children.forEach((page: any) => {
            if (page.meta?.title
              && page.name !== '/[...all]'
              && !page.name.includes('[')) {
              // 使用完整的路径组合
              const fullPath = route.path + (page.path || '')
              pageRoutes.push({
                path: fullPath,
                name: page.name,
                meta: page.meta,
              })
            }
          })
        }
      })
    }

    // 直接处理有标题的顶层路由（排除主页和404）
    if (route.meta?.title
      && route.path !== '/'
      && route.path !== '/:all(.*)'
      && !route.path.includes('[')
      && route.name !== '/[...all]'
      && !route.children) { // 确保不是有children的路由
      pageRoutes.push(route)
    }
  })
}

extractRoutes(routes)

// 按路径排序
pageRoutes.sort((a, b) => {
  return a.path.localeCompare(b.path)
})
</script>

<template>
  <div
    from-blue-500 to-purple-600 bg-gradient-to-r
    dark:from-blue-800 dark:to-purple-900
    p="24px" min-h="100vh"
    sm:p="16px"
  >
    <div text="center" mb="40px">
      <h1 text="2.5rem" font="600" mb="12px" sm:text="2rem">
        Vue 3 前端沙盒
      </h1>
      <p text="1.2rem" opacity-90 m="0" sm:text="1rem">
        用于运行演示代码和调试新组件
      </p>
    </div>
    <NSpace vertical size="large">
      <div
        v-if="pageRoutes.length === 0"
        flex="~" justify="center" items="center" min-h="200px"
      >
        <NCard max-w="600px" text="center">
          <div>
            <h3 text="1.5rem" color="#333" m="0 0 16px 0">
              暂无其他页面
            </h3>
            <p color="#666" leading="1.6" m="8px 0">
              当前项目只有主页和404页面
            </p>
            <p color="#666" leading="1.6" m="8px 0">
              您可以在
              <code bg="#f5f5f5" p="2px 6px" rounded="3px" font="mono" color="#e83e8c">
                src/pages/
              </code>
              目录下创建新的Vue文件来添加更多页面
            </p>
          </div>
        </NCard>
      </div>

      <NGrid v-else x-gap="16px" y-gap="16px" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGi v-for="route in pageRoutes" :key="route.path">
          <NCard
            cursor="pointer"
            transition="all duration-300 ease"
            rounded="12px"
            hover:translate-y="-4px"
            hover:shadow="[0_12px_24px_rgba(0,0,0,0.15)]"
            h="full"
            flex="~ col"
            @click="$router.push(route.path)"
          >
            <div p="8px 0">
              <h3 text="1.2rem" font="600" text-gray-800 mb-2px dark:text-gray-100 sm:text="1.1rem">
                {{ route.meta?.title || route.name }}
              </h3>
              <p v-if="route.meta?.description" text="0.9rem" text-gray-600 leading-relaxed my-2 dark:text-gray-400>
                {{ route.meta.description }}
              </p>
              <p text="0.9rem" font="mono" p="4px 8px" rounded="4px" text-gray-600 bg-gray-100 inline-block dark:text-gray-300 dark:bg-gray-800 sm:text="0.8rem">
                {{ route.path }}
              </p>
            </div>
            <template #footer>
              <NButton type="primary" block @click.stop="$router.push(route.path)">
                进入页面
              </NButton>
            </template>
          </NCard>
        </NGi>
      </NGrid>
    </NSpace>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '主页'
</route>
