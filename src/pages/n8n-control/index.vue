<script setup lang="ts">
/**
 * n8n 流程控制页面
 */

import type { Workflow } from './types'
import { loadWorkflowConfig } from './api'
import VerificationModal from './components/VerificationModal.vue'
import { useN8nToken } from './composables/useN8nToken'

// 配置
const authWebhookUrl = ref('')
const tokenWebhookUrl = ref('')
const workflows = ref<Workflow[]>([])
const loadError = ref('')

// Token 管理
const {
  showModal,
  verificationCode,
  currentWorkflow,
  loading,
  results,
  trigger,
  confirmExecute,
} = useN8nToken()

/**
 * 加载流程配置
 */
async function loadConfig() {
  try {
    const config = await loadWorkflowConfig()
    authWebhookUrl.value = config.authWebhookUrl
    tokenWebhookUrl.value = config.tokenWebhookUrl
    workflows.value = config.workflows
  }
  catch (error) {
    console.error('加载流程配置失败:', error)
    loadError.value = '加载流程配置失败，请检查配置文件'
  }
}

/**
 * 触发流程
 */
function onTriggerClick(workflow: Workflow) {
  trigger(workflow, authWebhookUrl.value)
}

/**
 * 确认执行
 */
function onConfirm() {
  confirmExecute(tokenWebhookUrl.value)
}

/**
 * 获取结果标签类型
 */
function getResultType(workflowId: string) {
  const result = results.value[workflowId]
  if (!result)
    return undefined
  return result.success ? 'success' : 'error'
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div p="4 md:6" min-h-screen bg-gradient-to-br="from-blue-50 to-indigo-100">
    <!-- 标题和描述 -->
    <div mb="6 md:8">
      <h1 text="6 md:8" font-bold text-center>
        n8n 流程控制
      </h1>
      <p text="3.5 md:4" text-gray-600 mt-2 text-center>
        触发 n8n webhook 流程
      </p>
    </div>

    <!-- 主内容区域 -->
    <div mx-auto max-w-4xl>
      <!-- 加载错误提示 -->
      <NAlert v-if="loadError" type="error" mb-6>
        {{ loadError }}
      </NAlert>

      <!-- 流程列表 -->
      <div v-if="workflows.length > 0" grid="~ cols-1 md:cols-2 lg:cols-3" gap-4>
        <NCard
          v-for="workflow in workflows"
          :key="workflow.id"
          hoverable
        >
          <div flex flex-col gap-4 h-full>
            <!-- 流程信息 -->
            <div flex-1>
              <h3 text-lg font-semibold mb-2>
                {{ workflow.name }}
              </h3>
              <p text-sm text-gray-600>
                {{ workflow.description }}
              </p>
            </div>

            <!-- 状态标签 -->
            <div v-if="results[workflow.id]">
              <NTag :type="getResultType(workflow.id)" size="small">
                {{ results[workflow.id].message }}
              </NTag>
            </div>

            <!-- 触发按钮 -->
            <NButton
              type="primary"
              :loading="loading[workflow.id]"
              block
              @click="onTriggerClick(workflow)"
            >
              触发流程
            </NButton>
          </div>
        </NCard>
      </div>

      <!-- 空状态 -->
      <NCard v-else-if="!loadError">
        <div py-8 text-center>
          <p text-gray-500>
            暂无可用的流程
          </p>
        </div>
      </NCard>
    </div>

    <!-- 验证码输入弹框 -->
    <VerificationModal
      v-model:show="showModal"
      v-model:code="verificationCode"
      :loading="loading[currentWorkflow?.id || '']"
      @confirm="onConfirm"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: 'n8n 流程控制'
  description: '触发 n8n webhook 流程'
  tags: ['n8n', 'webhook', '自动化']
</route>
