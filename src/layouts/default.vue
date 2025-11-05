<script setup lang="ts">
const router = useRouter()
const head = useHead()

watchEffect(() => {
  head.patch({
    title: router.currentRoute.value.meta?.menu?.title
      ? `${router.currentRoute.value.meta.menu.title} | ${import.meta.env.VITE_APP_NAME}`
      : import.meta.env.VITE_APP_NAME,
  })
})
</script>

<template>
  <RouterView />
</template>

<style scoped>

</style>
