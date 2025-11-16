<script setup lang="ts">
interface MessageInfo {
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  show: boolean
}

interface Props {
  messageInfo: MessageInfo
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClose(): void {
  emit('close')
}
</script>

<template>
  <NAlert
    v-if="messageInfo.show"
    :type="messageInfo.type"
    closable
    class="message-alert"
    @close="handleClose"
  >
    {{ messageInfo.content }}
  </NAlert>
</template>

<style scoped>
.message-alert {
  max-width: 448px; /* max-w-md */
  transform: translateX(-50%);
  left: 50%;
  top: 16px; /* top-4 */
  position: fixed;
  z-index: 50;
}
</style>
