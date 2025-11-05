<script setup lang="ts">
interface Props {
  title?: string
  value?: number
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '1',
  value: 0,
  icon: 'i-carbon-user-multiple',
})
</script>

<template>
  <div
    class="bg-[linear-gradient(90deg,#0849B2_0%,#1062B2_100%)]"
    p="x-35px y15px"
    text-white rounded-2xl
    flex items-center justify-between
  >
    <div
      class="bg-[linear-gradient(90deg,#64B2FF_0%,#2E94F4_100%)]"
      p-15px rounded-2xl
    >
      <div text-40px :class="[props.icon]" />
    </div>
    <div flex="~ col" items-center justify-center>
      <div text-30px>
        {{ props.title }}
      </div>
      <div text-35px>
        {{ props.value }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
