<script setup lang="ts">
import { useMnistStore } from '~/stores/mnist'
import { useModel } from '../composables/useModel'

const emit = defineEmits<{
  startTraining: []
}>()

const store = useMnistStore()
const { saveModel, loadModel, checkModelExists, createModel } = useModel()
const message = useMessage()

const modelExists = ref(false)

onMounted(async () => {
  modelExists.value = await checkModelExists()
})

async function handleLoadSaved() {
  const success = await loadModel()
  if (success) {
    message.success('模型加载成功')
  }
  else {
    message.error('模型加载失败')
  }
}

async function handleSave() {
  const success = await saveModel()
  if (success) {
    message.success('模型保存成功')
    modelExists.value = true
  }
  else {
    message.error('模型保存失败')
  }
}

function handleTrainNew() {
  if (!store.model) {
    const model = createModel()
    store.setModel(model, 'custom')
  }
  emit('startTraining')
}
</script>

<template>
  <div flex flex-col gap-3>
    <NSpace vertical>
      <NButton
        v-if="modelExists"
        type="primary"
        block
        @click="handleLoadSaved"
      >
        加载已保存模型
      </NButton>

      <NButton
        type="info"
        block
        @click="handleTrainNew"
      >
        训练新模型
      </NButton>

      <NButton
        v-if="store.model"
        type="success"
        block
        @click="handleSave"
      >
        保存当前模型
      </NButton>
    </NSpace>

    <div v-if="store.modelType" text-sm text-gray-600 mt-2 dark:text-gray-400>
      <div>模型类型: {{ store.modelType === 'pretrained' ? '预训练' : '自定义' }}</div>
      <div v-if="store.modelMetadata.trainedAt">
        训练时间: {{ new Date(store.modelMetadata.trainedAt).toLocaleString() }}
      </div>
      <div v-if="store.modelMetadata.accuracy > 0">
        准确率: {{ (store.modelMetadata.accuracy * 100).toFixed(2) }}%
      </div>
    </div>
  </div>
</template>
