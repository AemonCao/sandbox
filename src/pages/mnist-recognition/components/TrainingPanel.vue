<script setup lang="ts">
import * as echarts from 'echarts'
import { useMnistStore } from '~/stores/mnist'
import { useTraining } from '../composables/useTraining'

const store = useMnistStore()
const { trainModel } = useTraining()
const message = useMessage()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const epochs = ref(10)
const batchSize = ref(128)

async function handleStartTraining() {
  message.info('开始训练模型，这可能需要5-15分钟...')
  const success = await trainModel({
    epochs: epochs.value,
    batchSize: batchSize.value,
  })

  if (success) {
    message.success('模型训练完成！')
  }
  else {
    message.error('模型训练失败')
  }
}

watch(() => store.trainingProgress.history, (history) => {
  if (!chart || !chartRef.value)
    return

  chart.setOption({
    title: {
      text: '训练进度',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['训练损失', '训练准确率', '验证损失', '验证准确率'],
    },
    xAxis: {
      type: 'category',
      data: history.loss.map((_, i) => `Epoch ${i + 1}`),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '训练损失',
        type: 'line',
        data: history.loss,
      },
      {
        name: '训练准确率',
        type: 'line',
        data: history.accuracy,
      },
      {
        name: '验证损失',
        type: 'line',
        data: history.valLoss,
      },
      {
        name: '验证准确率',
        type: 'line',
        data: history.valAccuracy,
      },
    ],
  })
}, { deep: true })

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
  }
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<template>
  <div flex flex-col gap-4>
    <div p-4 rounded-lg bg-blue-50>
      <h3 text-lg font-semibold mb-3>
        训练参数
      </h3>
      <NSpace vertical>
        <div flex gap-3 items-center>
          <span w-24>训练轮数:</span>
          <NInputNumber v-model:value="epochs" :min="1" :max="50" />
        </div>
        <div flex gap-3 items-center>
          <span w-24>批次大小:</span>
          <NInputNumber v-model:value="batchSize" :min="32" :max="512" :step="32" />
        </div>
      </NSpace>

      <NButton
        type="primary"

        mt-4 block
        :loading="store.isTraining"
        :disabled="store.isTraining"
        @click="handleStartTraining"
      >
        {{ store.isTraining ? '训练中...' : '开始训练' }}
      </NButton>
    </div>

    <div v-if="store.isTraining || store.trainingProgress.epoch > 0" p-4 rounded-lg bg-gray-50>
      <h3 text-lg font-semibold mb-3>
        训练进度
      </h3>
      <div text-sm flex flex-col gap-2>
        <div>当前轮次: {{ store.trainingProgress.epoch }} / {{ epochs }}</div>
        <div>当前批次: {{ store.trainingProgress.batch }}</div>
        <div>训练损失: {{ store.trainingProgress.loss.toFixed(4) }}</div>
        <div>训练准确率: {{ (store.trainingProgress.accuracy * 100).toFixed(2) }}%</div>
        <div>验证损失: {{ store.trainingProgress.valLoss.toFixed(4) }}</div>
        <div>验证准确率: {{ (store.trainingProgress.valAccuracy * 100).toFixed(2) }}%</div>
      </div>

      <div ref="chartRef" mt-4 h-80 />
    </div>
  </div>
</template>
