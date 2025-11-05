<script setup lang="ts">
import { useCountdown } from '@vueuse/core'
import { NButton, NResult } from 'naive-ui'

const router = useRouter()

// 倒计时 5 秒后返回首页
const countdownSeconds = 5
const { start, remaining } = useCountdown(countdownSeconds, {
  onComplete() {
    backIndex()
  },
})

function backIndex() {
  router.replace('/')
}

start()
</script>

<template>
  <div flex="~ col" gap-2 h-full w-full select-none items-center justify-center>
    <NResult status="404" title="404 资源不存在" description="生活总归带点荒谬" size="huge">
      <template #footer>
        <div flex="~ col" gap-2 items-center justify-center>
          <span>{{ remaining }} 秒后将返回首页</span>
          <NButton type="info" ghost @click="backIndex">
            立即返回
          </NButton>
        </div>
      </template>
    </NResult>
  </div>
</template>

<style scoped>

</style>

<route lang="yaml">
meta:
  layout: default
  title: '404'
</route>
