<script setup lang="ts">
/**
 * 验证码输入弹框组件
 */

interface Props {
  show: boolean
  loading: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const verificationCode = defineModel<string>('code', { required: true })

/**
 * 验证码格式是否正确（6位数字）
 */
const isCodeValid = computed(() => /^\d{6}$/.test(verificationCode.value))

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})
</script>

<template>
  <NModal v-model:show="showModal" preset="dialog" title="输入验证码">
    <div flex flex-col gap-4>
      <p text-sm text-gray-600>
        验证码已发送到您的邮箱，请输入6位数字验证码
      </p>

      <NInput
        v-model:value="verificationCode"
        placeholder="请输入6位数字验证码"
        size="large"
        maxlength="6"
        show-count
        clearable
      />

      <div v-if="verificationCode && !isCodeValid" text-sm text-red-500>
        验证码必须是6位数字
      </div>
    </div>

    <template #action>
      <NSpace justify="end">
        <NButton @click="showModal = false">
          取消
        </NButton>
        <NButton
          type="primary"
          :disabled="!isCodeValid"
          :loading="loading"
          @click="emit('confirm')"
        >
          确认执行
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
