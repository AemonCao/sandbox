<script setup lang="ts">
const router = useRouter()
const head = useHead()

watchEffect(() => {
  head.patch({
    title: router.currentRoute.value.meta?.title
      ? `${router.currentRoute.value.meta.title} | ${import.meta.env.VITE_APP_NAME}`
      : import.meta.env.VITE_APP_NAME,
  })
})

const buildTime = __BUILD_TIME__
const commitId = __GIT_COMMIT_ID__
const commitUrl = `${import.meta.env.VITE_GIT_REPO_URL}/commit/${commitId}`

const isHomePage = computed(() => router.currentRoute.value.path === '/')
</script>

<template>
  <div flex flex-col h-screen relative>
    <!-- 返回按钮 -->
    <button
      v-if="!isHomePage"
      z="1000"
      shadow="[0_2px_8px_rgba(0,0,0,0.15)]"
      hover:shadow="[0_4px_12px_rgba(0,0,0,0.2)]"
      border="2 solid gray-300" rounded-full bg-white flex h-12 w-12 cursor-pointer transition-all duration-300 ease-in-out items-center left-5 top-5 justify-center fixed dark:border-gray-600 dark:bg-gray-800
      title="返回主页"
      @click="router.push('/')"
    >
      <span text-xl leading-none>🏠</span>
    </button>
    <!-- 主题切换按钮 -->
    <button
      z="1000"
      shadow="[0_2px_8px_rgba(0,0,0,0.15)]"
      hover:shadow="[0_4px_12px_rgba(0,0,0,0.2)]"
      border="2 solid gray-300" rounded-full bg-white flex h-12 w-12 cursor-pointer transition-all duration-300 ease-in-out items-center right-5 top-5 justify-center fixed dark:border-gray-600 dark:bg-gray-800
      :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      @click="toggleDark"
    >
      <span v-if="isDark" text-xl leading-none>🌙</span>
      <span v-else text-xl leading-none>☀️</span>
    </button>
    <div flex-1>
      <RouterView />
    </div>
    <footer text-xs text-gray-400 py-2 text-center border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900>
      <div>构建时间: {{ buildTime }}</div>
      <div>
        Commit: <a :href="commitUrl" target="_blank" text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300>{{ commitId }}</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 深色模式下的阴影调整 */
.dark button {
  --at-apply: shadow-[0_2px_8px_rgba(0, 0, 0, 0.3)];
}

.dark button:hover {
  --at-apply: shadow-[0_4px_12px_rgba(0, 0, 0, 0.4)];
}
</style>
