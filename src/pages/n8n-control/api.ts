/**
 * n8n API 请求函数
 */

import type { WorkflowConfig } from './types'

/**
 * 加载流程配置文件
 */
export async function loadWorkflowConfig(): Promise<WorkflowConfig> {
  const response = await fetch('/config/workflows.json')
  if (!response.ok)
    throw new Error('加载配置文件失败')

  return response.json()
}

/**
 * 发送验证码
 * @param authWebhookUrl - 验证码 webhook URL
 */
export async function sendVerificationCode(authWebhookUrl: string): Promise<void> {
  await fetch(authWebhookUrl, { method: 'GET' })
}

/**
 * 获取 token
 * @param tokenWebhookUrl - token webhook URL
 * @param code - 验证码
 */
export async function fetchToken(tokenWebhookUrl: string, code: string): Promise<string> {
  const response = await fetch(`${tokenWebhookUrl}/${code}`)

  if (response.status === 401)
    throw new Error('验证码错误或已过期')

  if (!response.ok)
    throw new Error('获取令牌失败')

  const { token } = await response.json()
  return token
}

/**
 * 触发 webhook 流程
 * @param webhookUrl - webhook URL
 * @param method - 请求方法
 * @param token - 认证 token
 */
export async function triggerWorkflow(
  webhookUrl: string,
  method: 'GET' | 'POST',
  token: string,
): Promise<Response> {
  return fetch(webhookUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
}
