/**
 * n8n 流程控制相关类型定义
 */

export interface Workflow {
  id: string
  name: string
  description: string
  webhookUrl: string
  method: 'POST' | 'GET'
}

export interface WorkflowResult {
  success: boolean
  message: string
}

export interface WorkflowConfig {
  authWebhookUrl: string
  tokenWebhookUrl: string
  workflows: Workflow[]
}
