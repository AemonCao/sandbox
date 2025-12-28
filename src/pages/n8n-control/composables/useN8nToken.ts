/**
 * Token 管理 composable
 */

import type { Workflow, WorkflowResult } from '../types'
import { fetchToken, sendVerificationCode, triggerWorkflow } from '../api'

export function useN8nToken() {
  const message = useMessage()
  const cachedToken = ref('')
  const showModal = ref(false)
  const verificationCode = ref('')
  const currentWorkflow = ref<Workflow | null>(null)
  const sendingCode = ref(false)
  const loading = ref<Record<string, boolean>>({})
  const results = ref<Record<string, WorkflowResult>>({})

  /**
   * 验证码格式是否正确（6位数字）
   */
  const isCodeValid = computed(() => /^\d{6}$/.test(verificationCode.value))

  /**
   * 使用 token 执行流程
   */
  async function executeWithToken(workflow: Workflow, token: string) {
    loading.value[workflow.id] = true
    delete results.value[workflow.id]

    try {
      const response = await triggerWorkflow(workflow.webhookUrl, workflow.method, token)

      if (response.status === 401) {
        cachedToken.value = ''
        message.warning('认证已过期，请重新验证')
        await requestToken(workflow)
        return
      }

      if (response.ok) {
        results.value[workflow.id] = { success: true, message: '执行成功' }
        message.success('流程执行成功')
      }
      else {
        results.value[workflow.id] = { success: false, message: `执行失败 (${response.status})` }
        message.error(`流程执行失败 (${response.status})`)
      }
    }
    catch (error) {
      console.error('触发流程失败:', error)
      results.value[workflow.id] = { success: false, message: '网络错误' }
      message.error('网络错误，请稍后重试')
    }
    finally {
      loading.value[workflow.id] = false
    }
  }

  /**
   * 请求获取 token
   */
  async function requestToken(workflow: Workflow, authUrl?: string) {
    currentWorkflow.value = workflow
    verificationCode.value = ''
    showModal.value = true

    if (authUrl) {
      sendingCode.value = true
      try {
        await sendVerificationCode(authUrl)
      }
      catch (error) {
        console.error('发送验证码失败:', error)
      }
      finally {
        sendingCode.value = false
      }
    }
  }

  /**
   * 确认执行流程
   */
  async function confirmExecute(tokenUrl: string) {
    if (!isCodeValid.value || !currentWorkflow.value)
      return

    const workflow = currentWorkflow.value
    loading.value[workflow.id] = true
    delete results.value[workflow.id]

    try {
      const token = await fetchToken(tokenUrl, verificationCode.value)
      cachedToken.value = token
      message.success('验证成功，正在执行流程...')
      showModal.value = false

      await executeWithToken(workflow, token)
    }
    catch (error: any) {
      results.value[workflow.id] = { success: false, message: error.message }
      loading.value[workflow.id] = false
    }
  }

  /**
   * 触发流程
   */
  async function trigger(workflow: Workflow, authUrl?: string) {
    if (cachedToken.value) {
      await executeWithToken(workflow, cachedToken.value)
    }
    else {
      await requestToken(workflow, authUrl)
    }
  }

  return {
    cachedToken,
    showModal,
    verificationCode,
    currentWorkflow,
    sendingCode,
    loading,
    results,
    isCodeValid,
    trigger,
    confirmExecute,
  }
}
