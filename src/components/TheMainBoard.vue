<script setup lang="ts">
import TheMainTitle from './TheMainTitle.vue'

interface Props {
  /**
   * 主标题
   * @default ''
   */
  title?: string
  /**
   * 是否显示标题
   * @default true
   */
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showTitle: true,
})
</script>

<template>
  <div flex="~ col" h-full>
    <TheMainTitle
      v-if="props.showTitle"
      :title="props.title"
      shrink-0
    />
    <div flex-1 h-full overflow-hidden>
      <slot />
    </div>
  </div>
</template>

<style scoped>

</style>
