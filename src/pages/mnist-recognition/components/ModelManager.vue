<script setup lang="ts">
import type { ModelMetadata } from '../services/modelStorage'
import * as tf from '@tensorflow/tfjs'
import { deleteModel, listModels, saveModelWithMetadata } from '../services/modelStorage'

const emit = defineEmits<{
  select: [name: string]
}>()
const message = useMessage()
const dialog = useDialog()
const selectedModel = ref<string>('')

const refreshTrigger = ref(0)
const models = ref<ModelMetadata[]>([])

async function loadModels() {
  models.value = (await listModels()).sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  )
}

watch(refreshTrigger, loadModels)
onMounted(loadModels)

const columns = computed(() => [
  { title: '名称', key: 'name', width: 150, ellipsis: { tooltip: true } },
  { title: '开始时间', key: 'startTime', width: 160, render: (row: ModelMetadata) => new Date(row.startTime).toLocaleString() },
  { title: '训练时长', key: 'totalTime', width: 100, render: (row: ModelMetadata) => `${(row.totalTime / 1000).toFixed(1)}s` },
  { title: '轮次', key: 'epochs', width: 70 },
  { title: '批次', key: 'batches', width: 70 },
  { title: '训练损失', key: 'trainLoss', width: 100, render: (row: ModelMetadata) => row.trainLoss.toFixed(4) },
  { title: '训练准确率', key: 'trainAccuracy', width: 110, render: (row: ModelMetadata) => `${(row.trainAccuracy * 100).toFixed(2)}%` },
  { title: '验证损失', key: 'valLoss', width: 100, render: (row: ModelMetadata) => row.valLoss.toFixed(4) },
  { title: '验证准确率', key: 'valAccuracy', width: 110, render: (row: ModelMetadata) => `${(row.valAccuracy * 100).toFixed(2)}%` },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: ModelMetadata) => {
      const isSelected = selectedModel.value === row.name
      const Button = resolveComponent('NButton')
      return h('div', { class: 'flex gap-2' }, [
        h(Button, { size: 'small', type: isSelected ? 'primary' : 'default', onClick: () => handleSelect(row) }, { default: () => '选择' }),
        h(Button, { size: 'small', onClick: () => handleExport(row) }, { default: () => '导出' }),
        h(Button, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ])
    },
  },
])

async function handleExport(model: ModelMetadata) {
  try {
    const tfModel = await tf.loadLayersModel(`indexeddb://${model.name}`)
    await tfModel.save(`downloads://${model.name}`)
    message.success('模型已导出')
  }
  catch {
    message.error('导出失败')
  }
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.multiple = true
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files || files.length === 0)
      return

    try {
      const fileArray = Array.from(files)

      // 验证文件
      const hasModelJson = fileArray.some(f => f.name === 'model.json')
      const hasWeights = fileArray.some(f => f.name.includes('.bin'))

      if (!hasModelJson || !hasWeights) {
        message.error('请选择完整的模型文件（model.json 和 .bin 文件）')
        return
      }

      const model = await tf.loadLayersModel(tf.io.browserFiles(fileArray))
      const name = `mnist-model-imported-${Date.now()}`

      const metadata: ModelMetadata = {
        name,
        startTime: new Date().toISOString(),
        totalTime: 0,
        epochs: 0,
        batches: 0,
        trainLoss: 0,
        trainAccuracy: 0,
        valLoss: 0,
        valAccuracy: 0,
      }

      await saveModelWithMetadata(model, metadata)
      message.success('模型已导入')
      refreshTrigger.value++
    }
    catch (error) {
      message.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  input.click()
}

function handleDelete(model: ModelMetadata) {
  dialog.warning({
    title: '删除模型',
    content: `确定删除模型 ${model.name}？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteModel(model.name)
        refreshTrigger.value++
        message.success('已删除')
      }
      catch {
        message.error('删除失败')
      }
    },
  })
}

async function handleSelect(model: ModelMetadata) {
  selectedModel.value = model.name
  emit('select', model.name)
}
</script>

<template>
  <div>
    <div mb-4>
      <n-button size="small" block @click="handleImport">
        导入模型
      </n-button>
    </div>

    <n-data-table
      v-if="models.length > 0"
      :columns="columns"
      :data="models"
      :pagination="false"
      size="small"
      :max-height="600"
      :scroll-x="1200"
    />

    <n-empty v-else description="暂无保存的模型" />
  </div>
</template>
