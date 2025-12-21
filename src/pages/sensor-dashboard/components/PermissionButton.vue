<script setup lang="ts">
interface Props {
  loading?: boolean
}

defineProps<Props>()
defineEmits<{
  request: []
}>()
</script>

<template>
  <button
    bg-gradient-to-r="from-orange-500 to-red-500"
    hover:shadow-lg="~ orange-500/50"
    text-white font-medium px-4 py-2 rounded-lg w-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105
    @click="$emit('request')"
  >
    <div flex gap-2 items-center justify-center>
      <div v-if="!loading" i-carbon-locked />
      <div v-else i-carbon-loading animate-spin />
      <span>{{ loading ? '请求中...' : '请求权限' }}</span>
    </div>
  </button>
</template>
