<script setup lang="ts">
import type { ModelMetadata } from '../services/modelStorage'
import * as tf from '@tensorflow/tfjs'
import JSZip from 'jszip'
import { NButton } from 'naive-ui'
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
  { title: '训练时长', key: 'totalTime', width: 100, render: (row: ModelMetadata) => row.totalTime ? `${(row.totalTime / 1000).toFixed(1)}s` : '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.totalTime || 0) - (b.totalTime || 0) },
  { title: '轮次', key: 'epochs', width: 70, render: (row: ModelMetadata) => row.epochs || '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.epochs || 0) - (b.epochs || 0) },
  { title: '批次', key: 'batches', width: 70, render: (row: ModelMetadata) => row.batches || '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.batches || 0) - (b.batches || 0) },
  { title: '训练损失', key: 'trainLoss', width: 100, render: (row: ModelMetadata) => row.trainLoss ? row.trainLoss.toFixed(4) : '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.trainLoss || 0) - (b.trainLoss || 0) },
  { title: '训练准确率', key: 'trainAccuracy', width: 110, render: (row: ModelMetadata) => row.trainAccuracy ? `${(row.trainAccuracy * 100).toFixed(2)}%` : '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.trainAccuracy || 0) - (b.trainAccuracy || 0) },
  { title: '验证损失', key: 'valLoss', width: 100, render: (row: ModelMetadata) => row.valLoss ? row.valLoss.toFixed(4) : '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.valLoss || 0) - (b.valLoss || 0) },
  { title: '验证准确率', key: 'valAccuracy', width: 110, render: (row: ModelMetadata) => row.valAccuracy ? `${(row.valAccuracy * 100).toFixed(2)}%` : '-', sorter: (a: ModelMetadata, b: ModelMetadata) => (a.valAccuracy || 0) - (b.valAccuracy || 0) },
  { title: '开始时间', key: 'startTime', width: 160, render: (row: ModelMetadata) => new Date(row.startTime).toLocaleString(), sorter: (a: ModelMetadata, b: ModelMetadata) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime() },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right' as const,
    render: (row: ModelMetadata) => {
      const isSelected = selectedModel.value === row.name
      return h('div', { class: 'flex gap-2' }, [
        h(NButton, { size: 'small', type: isSelected ? 'primary' : 'default', onClick: () => handleSelect(row) }, { default: () => isSelected ? '当前' : '选择' }),
        h(NButton, { size: 'small', onClick: () => handleExport(row) }, { default: () => '导出' }),
        h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ])
    },
  },
])

async function handleExport(model: ModelMetadata) {
  try {
    const tfModel = await tf.loadLayersModel(`indexeddb://${model.name}`)
    const zip = new JSZip()

    // 保存模型到内存
    await tfModel.save(tf.io.withSaveHandler(async (artifacts) => {
      const modelTopology = { modelTopology: artifacts.modelTopology, weightsManifest: [{ paths: ['weights.bin'], weights: artifacts.weightSpecs! }] }
      zip.file('model.json', JSON.stringify(modelTopology))
      zip.file('weights.bin', artifacts.weightData as ArrayBuffer)
      zip.file('metadata.json', JSON.stringify(model, null, 2))
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }
    }))

    // 生成并下载 ZIP
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name}.zip`
    a.click()
    URL.revokeObjectURL(url)

    message.success('模型已导出为 ZIP 文件')
  }
  catch {
    message.error('导出失败')
  }
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.zip,.json,.bin'
  input.multiple = true
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files || files.length === 0)
      return

    try {
      const fileArray = Array.from(files)
      const zipFile = fileArray.find(f => f.name.endsWith('.zip'))

      if (zipFile) {
        // ZIP 文件导入
        const zip = await JSZip.loadAsync(zipFile)
        const modelJsonStr = await zip.file('model.json')?.async('string')
        const weightsBlob = await zip.file('weights.bin')?.async('blob')
        const metadataJson = await zip.file('metadata.json')?.async('string')

        if (!modelJsonStr || !weightsBlob) {
          message.error('ZIP 文件中缺少模型文件')
          return
        }

        const weightsFile = new File([weightsBlob], 'weights.bin')
        const modelJsonBlob = new Blob([modelJsonStr], { type: 'application/json' })
        const modelJsonFile = new File([modelJsonBlob], 'model.json')

        const model = await tf.loadLayersModel(tf.io.browserFiles([modelJsonFile, weightsFile]))
        model.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy'],
        })

        const metadata: ModelMetadata = metadataJson
          ? { ...JSON.parse(metadataJson), name: `${JSON.parse(metadataJson).name}-imported-${Date.now()}` }
          : {
              name: `mnist-model-imported-${Date.now()}`,
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
        message.success('模型已从 ZIP 导入')
        refreshTrigger.value++
      }
      else {
        // 传统多文件导入
        const metadataFile = fileArray.find(f => f.name.includes('metadata'))
        const modelFiles = fileArray.filter(f => !f.name.includes('metadata'))

        const hasModelJson = modelFiles.some(f => f.name.endsWith('.json'))
        const hasWeights = modelFiles.some(f => f.name.endsWith('.bin'))

        if (!hasModelJson || !hasWeights) {
          message.error('请选择完整的模型文件（model.json 和 .bin 文件）或 ZIP 文件')
          return
        }

        const model = await tf.loadLayersModel(tf.io.browserFiles(modelFiles))
        model.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy'],
        })

        const metadata: ModelMetadata = metadataFile
          ? { ...JSON.parse(await metadataFile.text()), name: `${JSON.parse(await metadataFile.text()).name}-imported-${Date.now()}` }
          : {
              name: `mnist-model-imported-${Date.now()}`,
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

defineExpose({
  refresh: () => refreshTrigger.value++,
  setSelected: (name: string) => selectedModel.value = name,
  handleImport,
})
</script>

<template>
  <div>
    <n-data-table
      v-if="models.length > 0"
      :columns="columns"
      :data="models"
      :pagination="false"
      size="small"
      :max-height="600"
      :scroll-x="1600"
    />

    <n-empty v-else description="暂无保存的模型" />
  </div>
</template>
