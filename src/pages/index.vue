<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { NCard, NSpace, NTag } from 'naive-ui'
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
    tags?: string[]
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

// 收集所有标签
const allTags = computed(() => {
  const tags = new Set<string>()
  pageRoutes.forEach((route) => {
    route.meta.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

// 选中的标签
const selectedTags = ref<Set<string>>(new Set())

// 过滤后的路由
const filteredRoutes = computed(() => {
  if (selectedTags.value.size === 0)
    return pageRoutes
  return pageRoutes.filter((route) => {
    return route.meta.tags?.some(tag => selectedTags.value.has(tag))
  })
})

/**
 * 切换标签选中状态
 * @param tag - 标签名称
 */
function toggleTag(tag: string) {
  if (selectedTags.value.has(tag))
    selectedTags.value.delete(tag)
  else
    selectedTags.value.add(tag)
}
</script>

<template>
  <div
    from-indigo-50 to-pink-50 via-purple-50 bg-gradient-to-br dark:from-gray-900 dark:to-indigo-900 dark:via-purple-900
    p="4 md:6" min-h="100vh"
  >
    <div text="center" mb="8 md:10">
      <h1 text="6 md:10" font="600" mb="3">
        Vue 3 前端沙盒
      </h1>
      <p text="4 md:5" opacity-90 m="0">
        用于运行演示代码和调试新组件
      </p>
    </div>

    <!-- 标签过滤器 -->
    <div v-if="allTags.length > 0" mb-6 flex justify-center>
      <div flex flex-wrap gap-2 max-w-4xl>
        <NTag
          v-for="tag in allTags"
          :key="tag"
          :type="selectedTags.has(tag) ? 'primary' : 'default'"
          :bordered="false"
          cursor-pointer
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </NTag>
      </div>
    </div>

    <NSpace vertical size="large">
      <div
        v-if="filteredRoutes.length === 0"
        flex="~" justify="center" items="center" min-h="200px"
      >
        <NCard max-w="600px" text="center">
          <div>
            <h3 text="1.5rem" color="#333" m="0 0 16px 0">
              暂无匹配页面
            </h3>
            <p color="#666" leading="1.6" m="8px 0">
              没有找到包含所选标签的页面
            </p>
          </div>
        </NCard>
      </div>

      <div v-else grid="~ cols-1 md:cols-2 lg:cols-3 xl:cols-4" gap="4">
        <NCard
          v-for="route in filteredRoutes"
          :key="route.path"
          cursor="pointer"
          transition="all duration-300 ease"
          rounded="3 md:3"
          hover:shadow="[0_8px_16px_rgba(0,0,0,0.15)]"
          h="full"
          flex="~ col"
          @click="$router.push(route.path)"
        >
          <div p="4 md:2">
            <h3 text="5 md:5" font="600" text-gray-800 mb-2 dark:text-gray-100>
              {{ route.meta?.title || route.name }}
            </h3>
            <p v-if="route.meta?.description" text="3.5 md:3.5" text-gray-600 leading-relaxed my-2 dark:text-gray-400>
              {{ route.meta.description }}
            </p>
            <div v-if="route.meta?.tags?.length" my-2 flex flex-wrap gap-1>
              <NTag v-for="tag in route.meta.tags" :key="tag" size="small" :bordered="false">
                {{ tag }}
              </NTag>
            </div>
            <p text="3 md:3.5" font="mono" p="2 md:1 2 md:2" rounded="1 md:1" text-gray-600 bg-gray-100 inline-block dark:text-gray-300 dark:bg-gray-800>
              {{ route.path }}
            </p>
          </div>
        </NCard>
      </div>
    </NSpace>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '主页'
</route>
