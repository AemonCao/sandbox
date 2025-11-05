<script setup lang="ts">
import { darkTheme, dateZhCN, NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider, zhCN } from 'naive-ui'
import { darkThemeOverrides, lightThemeOverrides } from '~/styles/customTheme'

const _theme = computed(() => {
  if (isDark.value)
    return darkTheme
  return undefined
})

// 主题重载
const _themeOverrides = computed(() => {
  return isDark.value ? darkThemeOverrides : lightThemeOverrides
})

useHead({
  title: import.meta.env.VITE_APP_NAME,
})
</script>

<template>
  <NConfigProvider
    h-full w-full select-none
    tag="main"
    :theme="_theme"
    :theme-overrides="_themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NNotificationProvider>
      <NDialogProvider>
        <NMessageProvider :max="2">
          <RouterView />
        </NMessageProvider>
      </NDialogProvider>
    </NNotificationProvider>
  </NConfigProvider>
</template>

<style scoped>
main {
  min-height: 100vh;
}

@supports (-webkit-touch-callout: none) {
  main {
    min-height: -webkit-fill-available;
  }
}
</style>
