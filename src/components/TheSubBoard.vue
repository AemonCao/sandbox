<script setup lang="ts">
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
  <div flex="~ col" text-white>
    <div
      v-if="props.showTitle"
      text-20px font-900 shrink-0
    >
      {{ title }}
    </div>
    <div flex-1 overflow-hidden>
      <slot />
    </div>
  </div>
</template>

<style scoped>

</style>
