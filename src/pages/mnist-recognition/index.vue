<script setup lang="ts">
import * as tf from '@tensorflow/tfjs'
import { useMnistStore } from '~/stores/mnist'
import DrawingCanvas from './components/DrawingCanvas.vue'
import ModelControls from './components/ModelControls.vue'
import ModelManager from './components/ModelManager.vue'
import PredictionList from './components/PredictionList.vue'
import TrainingPanel from './components/TrainingPanel.vue'
import { useModel } from './composables/useModel'
import { usePrediction } from './composables/usePrediction'
import '@tensorflow/tfjs-backend-webgl'

const store = useMnistStore()
const { createModel, loadModel, checkModelExists } = useModel()
const { predict } = usePrediction()
const message = useMessage()

const showTraining = ref(true)
const loading = ref(true)
const initError = ref('')

onMounted(async () => {
  try {
    loading.value = true
    await tf.setBackend('webgl')
    await tf.ready()

    const exists = await checkModelExists()
    if (exists) {
      const success = await loadModel()
      if (success) {
        message.success('已加载保存的模型')
        return
      }
    }

    const model = createModel()
    store.setModel(model, 'custom')
    message.info('创建了新模型，请先训练')
  }
  catch (error) {
    initError.value = error instanceof Error ? error.message : '初始化失败'
    message.error(`初始化失败: ${initError.value}`)
  }
  finally {
    loading.value = false
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

async function handleSelectModel(name: string) {
  const success = await loadModel(name)
  if (success) {
    message.success('已加载模型')
  }
  else {
    message.error('加载模型失败')
  }
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

    <NSpin :show="loading" description="初始化中...">
      <div v-if="initError" text-red-600 mb-4 p-4 rounded-lg bg-red-50>
        初始化错误: {{ initError }}
      </div>

      <div mx-auto gap-4 max-w-7xl flex="~ col xl:row">
        <!-- 左侧：模型管理 -->
        <div w="full xl:300px" p-4 rounded-lg bg-white flex-shrink-0 shadow-lg>
          <h2 text-lg font-semibold mb-4>
            模型管理
          </h2>
          <ModelManager @select="handleSelectModel" />
        </div>

        <div flex-1 gap-4 flex="~ col lg:row xl:col">
          <!-- 中间：绘图区 -->
          <div p-6 rounded-lg bg-white flex-1 shadow-lg>
            <h2 text-xl font-semibold mb-4>
              绘制数字
            </h2>
            <DrawingCanvas @update="handleDrawingUpdate" />
            <div mt-6>
              <ModelControls @start-training="handleStartTraining" />
            </div>
          </div>

          <!-- 右侧：识别结果 + 训练面板 -->
          <div p-6 rounded-lg bg-white flex-1 shadow-lg>
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
    </NSpin>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '手写数字识别'
</route>
