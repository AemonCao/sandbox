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
import '@tensorflow/tfjs-backend-cpu'

const store = useMnistStore()
const { createModel, loadModel, checkModelExists } = useModel()
const { predict } = usePrediction()
const message = useMessage()

const showTrainingModal = ref(false)
const loading = ref(true)
const initError = ref('')
const modelManagerRef = ref<InstanceType<typeof ModelManager>>()
const currentImageData = ref<number[]>([])

/**
 * 检测是否为移动设备
 */
function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

onMounted(async () => {
  try {
    loading.value = true

    // 移动设备使用 CPU backend，桌面设备使用 WebGL
    const backend = isMobileDevice() ? 'cpu' : 'webgl'
    await tf.setBackend(backend)
    await tf.ready()

    if (backend === 'cpu') {
      message.warning('检测到移动设备，已切换到 CPU 模式（训练速度较慢）')
    }

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

/**
 * 处理绘图更新事件，触发预测
 *
 * @param {number[]} imageData 图像数据数组
 */
function handleDrawingUpdate(imageData: number[]) {
  currentImageData.value = imageData
  if (imageData.length > 0) {
    predict(imageData)
  }
  else {
    store.clearPredictions()
  }
}

/**
 * 打开训练模态框
 */
function handleStartTraining() {
  showTrainingModal.value = true
}

/**
 * 加载选中的模型
 *
 * @param {string} name 模型名称
 */
async function handleSelectModel(name: string) {
  const success = await loadModel(name)
  if (success) {
    message.success('已加载模型')
    if (currentImageData.value.length > 0) {
      predict(currentImageData.value)
    }
  }
  else {
    message.error('加载模型失败')
  }
}

/**
 * 模型保存后刷新模型列表
 *
 * @param {string} modelName 保存的模型名称
 */
function handleModelSaved(modelName: string) {
  modelManagerRef.value?.refresh()
  modelManagerRef.value?.setSelected(modelName)
  showTrainingModal.value = false
}
</script>

<template>
  <div p="4 md:6" min-h-screen from-blue-50 to-indigo-100 bg-gradient-to-br dark:from-gray-900 dark:to-blue-900>
    <div mb="6 md:8">
      <h1 text="6 md:8" font-bold text-center dark:text-white>
        手写数字识别
      </h1>
      <p text="3.5 md:4" text-gray-600 mt-2 text-center dark:text-gray-300>
        使用神经网络识别手写数字 (MNIST)
      </p>
    </div>

    <NSpin :show="loading" description="初始化中...">
      <div v-if="initError" text="4 md:4" text-red-600 mb-4 p-4 rounded-lg bg-red-50 dark:text-red-300 dark:bg-red-900>
        初始化错误: {{ initError }}
      </div>

      <div mx-auto gap-4 max-w-7xl flex="~ col">
        <!-- 第一行：模型列表 -->
        <div p="4 md:6" rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-700>
          <div mb-4 gap-3 flex="~ col sm:row" items-start justify-between sm:items-center>
            <h2 text="5 md:5" font-semibold dark:text-white>
              模型列表
            </h2>
            <div flex flex-wrap gap-2>
              <NButton size="large" @click="modelManagerRef?.handleImport()">
                导入模型
              </NButton>
              <NButton size="large" type="primary" @click="showTrainingModal = true">
                训练新模型
              </NButton>
              <NButton size="large" type="error" @click="modelManagerRef?.handleClearAll()">
                清空所有
              </NButton>
            </div>
          </div>
          <ModelManager ref="modelManagerRef" @select="handleSelectModel" />
        </div>

        <!-- 第二行：绘图区 + 识别结果 -->
        <div gap-4 flex="~ col lg:row">
          <!-- 绘图区 -->
          <div p-4 rounded-lg bg-white flex-1 shadow-lg sm:p-6 dark:bg-gray-800 dark:shadow-gray-700>
            <h2 text-xl font-semibold mb-4 dark:text-white>
              绘制数字
            </h2>
            <DrawingCanvas @update="handleDrawingUpdate" />
          </div>

          <!-- 识别结果 -->
          <div p-4 rounded-lg bg-white flex-1 shadow-lg sm:p-6 dark:bg-gray-800 dark:shadow-gray-700>
            <h2 text-xl font-semibold mb-4 dark:text-white>
              识别结果
            </h2>
            <PredictionList :predictions="store.predictions" />
          </div>
        </div>
      </div>

      <!-- 训练弹窗 -->
      <NModal v-model:show="showTrainingModal" preset="card" title="模型训练" style="max-width: min(800px, 95vw)">
        <ModelControls @start-training="handleStartTraining" @model-loaded="handleDrawingUpdate(currentImageData)" />
        <TrainingPanel @saved="handleModelSaved" />
      </NModal>
    </NSpin>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '手写数字识别'
  description: '基于TensorFlow.js的神经网络训练和测试，支持交互式绘图和模型管理'
  tags: ['机器学习', 'TensorFlow.js', 'Canvas']
</route>
