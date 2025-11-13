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
</script>

<template>
  <div min-h-screen relative>
    <!-- 主题切换按钮 -->
    <button
      z="1000"
      shadow="[0_2px_8px_rgba(0,0,0,0.15)]"
      hover:shadow="[0_4px_12px_rgba(0,0,0,0.2)]"
      rounded-full border-none flex h-12 w-12 cursor-pointer transition-all duration-300 ease-in-out items-center right-5 top-5 justify-center fixed active:scale-95 hover:scale-110
      :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      @click="toggleDark"
    >
      <span v-if="isDark" text-xl leading-none>🌙</span>
      <span v-else text-xl leading-none>☀️</span>
    </button>
    <RouterView />
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
