<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { RouteRecordRaw } from 'vue-router'
import * as echarts from 'echarts'
import { NTag } from 'naive-ui'
import { routes } from 'vue-router/auto-routes'

defineOptions({ name: 'RecommendStatsPage' })

const { clickCounts, tagPopularity, clearAll, getTagScore } = useRecommend()
const message = useMessage()

// ---- 路由元信息提取 ----

interface RouteInfo {
  path: string
  meta: { title?: string, tags?: string[], [key: string]: any }
}

const pageRoutes: RouteInfo[] = []

/**
 * 扁平化提取所有有效页面路由
 */
function extractRoutes(routeList: readonly RouteRecordRaw[]) {
  routeList.forEach((route: any) => {
    if (route.children) {
      route.children.forEach((child: any) => {
        if (child.children) {
          child.children.forEach((page: any) => {
            if (page.meta?.title && page.name !== '/[...all]' && !page.name.includes('[')) {
              pageRoutes.push({ path: route.path + (page.path || ''), meta: page.meta })
            }
          })
        }
      })
    }
    if (route.meta?.title && route.path !== '/' && !route.path.includes('[') && !route.children) {
      pageRoutes.push(route)
    }
  })
}

extractRoutes(routes)

/** 路由路径 -> 标题映射 */
const routeTitleMap = computed(() => {
  const map: Record<string, string> = {}
  pageRoutes.forEach(r => map[r.path] = r.meta.title || r.path)
  return map
})

// ---- 概览统计 ----

/** 总点击次数 */
const totalClicks = computed(() => Object.values(clickCounts.value).reduce((s, v) => s + v, 0))
/** 已访问路由数 */
const routeCount = computed(() => Object.keys(clickCounts.value).length)
/** 已追踪标签数 */
const tagCount = computed(() => Object.keys(tagPopularity.value).length)
/** 是否有数据 */
const hasData = computed(() => routeCount.value > 0 || tagCount.value > 0)

// ---- 图表 ----

const clickChartRef = ref<HTMLElement | null>(null)
const tagChartRef = ref<HTMLElement | null>(null)

/** 路由点击排行柱状图配置 */
const clickChartOptions = computed<echarts.EChartsCoreOption>(() => {
  const entries = Object.entries(clickCounts.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const labels = entries.map(([path]) => routeTitleMap.value[path] || path)
  const values = entries.map(([, count]) => count)

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: '点击次数' },
    yAxis: {
      type: 'category',
      data: [...labels].reverse(),
      axisLabel: { width: 120, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      data: [...values].reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      label: { show: true, position: 'right' },
    }],
  }
})

/** 标签热度饼图配置 */
const tagChartOptions = computed<echarts.EChartsCoreOption>(() => {
  const entries = Object.entries(tagPopularity.value).sort((a, b) => b[1] - a[1])

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}' },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: entries.map(([name, value]) => ({ name, value })),
    }],
  }
})

useEcharts(clickChartRef, clickChartOptions)
useEcharts(tagChartRef, tagChartOptions)

// ---- 数据表格 ----

interface RouteStatsRow {
  path: string
  title: string
  clicks: number
  tagScore: number
  tags: string[]
}

/** 表格数据：合并路由表和点击记录 */
const tableData = computed<RouteStatsRow[]>(() => {
  const allPaths = new Set([
    ...pageRoutes.map(r => r.path),
    ...Object.keys(clickCounts.value),
  ])

  return Array.from(allPaths).map((path) => {
    const route = pageRoutes.find(r => r.path === path)
    const tags = route?.meta?.tags || []
    return {
      path,
      title: route?.meta?.title || '未知页面',
      clicks: clickCounts.value[path] || 0,
      tagScore: getTagScore({ path, meta: { tags } }),
      tags,
    }
  }).sort((a, b) => b.clicks - a.clicks)
})

/** 表格列定义 */
const tableColumns: DataTableColumns<RouteStatsRow> = [
  { title: '页面标题', key: 'title', width: 180, ellipsis: { tooltip: true } },
  { title: '路由路径', key: 'path', width: 200, ellipsis: { tooltip: true }, sorter: 'default' },
  { title: '点击次数', key: 'clicks', width: 120, sorter: (a, b) => a.clicks - b.clicks },
  { title: '标签热度分', key: 'tagScore', width: 120, sorter: (a, b) => a.tagScore - b.tagScore },
  {
    title: '标签',
    key: 'tags',
    render(row) {
      return row.tags.map(tag => h(NTag, { size: 'small', bordered: false }, { default: () => tag }))
    },
  },
]

/** 清除所有推荐数据 */
function handleClear() {
  clearAll()
  message.success('推荐数据已清除')
}
</script>

<template>
  <div

    p="4 md:6" min-h-screen from-blue-50 to-indigo-100 bg-gradient-to-br dark:from-gray-900 dark:to-indigo-900
  >
    <!-- 页面标题 -->
    <div text-center mb="6 md:8">
      <h1 text="6 md:8" font-600 mb-2>
        推荐数据统计
      </h1>
      <p text="4" m-0 opacity-80>
        查看和管理基于点击频率和标签热度的推荐排序数据
      </p>
    </div>

    <!-- 概览统计 -->
    <div grid="~ cols-1 md:cols-3" mb-6 gap-4>
      <NCard>
        <NStatistic label="总点击次数" :value="totalClicks" />
      </NCard>
      <NCard>
        <NStatistic label="已访问路由数" :value="routeCount" />
      </NCard>
      <NCard>
        <NStatistic label="已追踪标签数" :value="tagCount" />
      </NCard>
    </div>

    <!-- 图表区域 -->
    <div v-if="hasData" grid="~ cols-1 lg:cols-2" mb-6 gap-4>
      <NCard title="路由点击排行">
        <div ref="clickChartRef" h-96 />
      </NCard>
      <NCard title="标签热度分布">
        <div ref="tagChartRef" h-96 />
      </NCard>
    </div>
    <NCard v-else mb-6>
      <NEmpty description="暂无推荐数据，请先在首页浏览页面" />
    </NCard>

    <!-- 数据表格 -->
    <NCard title="路由详细数据" mb-6>
      <NDataTable
        :columns="tableColumns"
        :data="tableData"
        :pagination="false"
        :bordered="false"
      />
    </NCard>

    <!-- 操作区 -->
    <div flex justify-end>
      <NPopconfirm @positive-click="handleClear">
        <template #trigger>
          <NButton type="error" ghost>
            清除所有推荐数据
          </NButton>
        </template>
        确定要清除所有推荐数据吗？此操作不可撤销。
      </NPopconfirm>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '推荐数据统计'
  description: '查看和管理基于点击频率和标签热度的推荐排序数据'
  tags: ['数据可视化', '统计', '工具']
</route>
