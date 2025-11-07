<script setup lang="ts">
import { NButton, NCard, NGi, NGrid, NSpace } from 'naive-ui'
import { routes } from 'vue-router/auto-routes'

defineOptions({
  name: 'IndexPage',
})

interface RouteInfo {
  path: string
  name: string
  meta: {
    title: string
    layout?: string
  }
}

// 扁平化路由，获取所有有效的页面路由
const pageRoutes: RouteInfo[] = []

function extractRoutes(routeList: any[]) {
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
    class="from-blue-500 to-purple-600 bg-gradient-to-r"
    p="24px" min-h="100vh"
    sm:p="16px"
  >
    <div text="center" mb="40px">
      <h1 text="2.5rem" font="600" mb="12px" sm:text="2rem">
        数字孪生管理平台
      </h1>
      <p text="1.2rem" opacity="90" m="0" sm:text="1rem">
        选择功能模块进入相应页面
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
            @click="$router.push(route.path)"
          >
            <div p="8px 0">
              <h3 text="1.2rem" font="600" color="#333" m="0 0 8px 0" sm:text="1.1rem">
                {{ route.meta?.title || route.name }}
              </h3>
              <p text="0.9rem" color="#666" font="mono" bg="#f5f5f5" p="4px 8px" rounded="4px" inline-block sm:text="0.8rem">
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
