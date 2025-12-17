<script setup lang="ts">
import { useMnistStore } from '~/stores/mnist'
import DrawingCanvas from './components/DrawingCanvas.vue'
import ModelControls from './components/ModelControls.vue'
import PredictionList from './components/PredictionList.vue'
import TrainingPanel from './components/TrainingPanel.vue'
import { useModel } from './composables/useModel'
import { usePrediction } from './composables/usePrediction'

const store = useMnistStore()
const { createModel, loadModel, checkModelExists } = useModel()
const { predict } = usePrediction()
const message = useMessage()

const showTraining = ref(false)

onMounted(async () => {
  try {
    const exists = await checkModelExists()

    if (exists) {
      const success = await loadModel()
      if (success) {
        message.success('已加载保存的模型')
      }
      else {
        const model = createModel()
        store.setModel(model, 'custom')
        message.info('创建了新模型，请先训练')
      }
    }
    else {
      const model = createModel()
      store.setModel(model, 'custom')
      message.info('创建了新模型，请先训练')
    }
  }
  catch (error) {
    console.error('初始化错误:', error)
    const model = createModel()
    store.setModel(model, 'custom')
    message.warning('初始化失败，已创建新模型')
  }
})

function handleDrawingUpdate(imageData: number[]) {
  if (imageData.length > 0) {
    predict(imageData)
  }
  else {
    store.clearPredictions()
  }
}

function handleStartTraining() {
  showTraining.value = true
}
</script>

<template>
  <div p-4 min-h-screen from-blue-50 to-indigo-100 bg-gradient-to-br>
    <div mb-6>
      <h1 text-3xl font-bold text-center>
        手写数字识别
      </h1>
      <p text-gray-600 mt-2 text-center>
        使用神经网络识别手写数字 (MNIST)
      </p>
    </div>

    <div mx-auto gap-6 max-w-6xl grid="~ cols-1 lg:cols-2">
      <!-- 左侧：绘图区 -->
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl font-semibold mb-4>
          绘制数字
        </h2>
        <DrawingCanvas @update="handleDrawingUpdate" />
        <div mt-6>
          <ModelControls @start-training="handleStartTraining" />
        </div>
      </div>

      <!-- 右侧：识别结果 + 训练面板 -->
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl font-semibold mb-4>
          识别结果
        </h2>
        <PredictionList :predictions="store.predictions" />

        <div v-if="showTraining" mt-6>
          <TrainingPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '手写数字识别'
</route>
