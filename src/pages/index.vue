<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <div p-8 bg-gray-50 min-h-screen dark:bg-gray-900>
    <div mx-auto max-w-4xl>
      <!-- 页面标题 -->
      <div mb-12 text-center>
        <h1 text-4xl text-gray-900 font-bold mb-4 dark:text-white>
          数字孪生管理平台
        </h1>
        <p text-lg text-gray-600 dark:text-gray-400>
          一站式设备监控与智能分析解决方案
        </p>
      </div>

      <!-- 功能导航卡片 -->
      <div gap-6 grid grid-cols-1 md:grid-cols-2>
        <NCard
          title="设备监控"
          cursor-pointer transition-shadow hover:shadow-lg
          @click="$router.push('/device-monitor')"
        >
          <template #cover>
            <div bg-blue-100 flex h-32 items-center justify-center dark:bg-blue-900>
              <div i-carbon:chart-line-data text-6xl text-blue-600 dark:text-blue-400 />
            </div>
          </template>
          <p text-gray-600 dark:text-gray-400>
            实时监控建筑设备运行状态，及时发现异常情况
          </p>
        </NCard>

        <NCard
          title="能源管理"
          cursor-pointer transition-shadow hover:shadow-lg
          @click="$router.push('/energy-management')"
        >
          <template #cover>
            <div bg-green-100 flex h-32 items-center justify-center dark:bg-green-900>
              <div i-carbon:chart-line-data text-6xl text-green-600 dark:text-green-400 />
            </div>
          </template>
          <p text-gray-600 dark:text-gray-400>
            分析能源消耗数据，优化能源使用效率
          </p>
        </NCard>

        <NCard
          title="维护管理"
          cursor-pointer transition-shadow hover:shadow-lg
          @click="$router.push('/maintenance')"
        >
          <template #cover>
            <div bg-orange-100 flex h-32 items-center justify-center dark:bg-orange-900>
              <div i-carbon:tools text-6xl text-orange-600 dark:text-orange-400 />
            </div>
          </template>
          <p text-gray-600 dark:text-gray-400>
            制定设备维护计划，管理维护工单
          </p>
        </NCard>

        <NCard
          title="智能分析"
          cursor-pointer transition-shadow hover:shadow-lg
          @click="$router.push('/smart-analysis')"
        >
          <template #cover>
            <div bg-purple-100 flex h-32 items-center justify-center dark:bg-purple-900>
              <div i-carbon:chart-line-data text-6xl text-purple-600 dark:text-purple-400 />
            </div>
          </template>
          <p text-gray-600 dark:text-gray-400>
            数据深度分析，提供智能决策支持
          </p>
        </NCard>
      </div>

      <!-- 快速导航按钮 -->
      <div mt-12 text-center>
        <p text-gray-500 mb-4 dark:text-gray-400>
          快速导航
        </p>
        <div flex flex-wrap gap-4 justify-center>
          <NButton
            type="primary"
            @click="$router.push('/device-monitor')"
          >
            设备监控
          </NButton>
          <NButton
            type="success"
            @click="$router.push('/energy-management')"
          >
            能源管理
          </NButton>
          <NButton
            type="warning"
            @click="$router.push('/maintenance')"
          >
            维护管理
          </NButton>
          <NButton
            type="info"
            @click="$router.push('/smart-analysis')"
          >
            智能分析
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

<route lang="yaml">
meta:
  layout: default
  title: '主页'
</route>
