<script setup lang="ts">
import * as echarts from 'echarts'
import { useMnistStore } from '~/stores/mnist'
import { useModel } from '../composables/useModel'
import { useTraining } from '../composables/useTraining'

const emit = defineEmits<{ saved: [modelName: string] }>()

const store = useMnistStore()
const { trainModel, cancelTraining } = useTraining()
const { saveModel, createModel } = useModel()
const message = useMessage()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const epochs = ref(10)
const batchSize = ref(128)
const startTime = ref<Date>()
const totalBatches = ref(0)
const loadingStage = ref('')
const loadingProgress = ref(0)
const loadingSize = ref({ loaded: 0, total: 0 })
const trainingStartTime = ref<number>()
const estimatedTimeLeft = ref('')

function formatBytes(bytes: number) {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`
}

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0)
    return `${hours}小时${minutes % 60}分钟`
  if (minutes > 0)
    return `${minutes}分钟${seconds % 60}秒`
  return `${seconds}秒`
}

async function handleStartTraining() {
  message.info('开始训练模型，这可能需要5-15分钟...')
  startTime.value = new Date()
  totalBatches.value = 0
  trainingStartTime.value = undefined
  estimatedTimeLeft.value = ''

  const model = createModel()
  store.setModel(model, 'custom')

  const success = await trainModel({
    epochs: epochs.value,
    batchSize: batchSize.value,
    onProgress: (stage, progress, loaded, total) => {
      loadingStage.value = stage === 'fetching' ? '下载数据集' : '解析数据'
      loadingProgress.value = progress
      if (loaded !== undefined && total !== undefined)
        loadingSize.value = { loaded, total }
    },
  })

  loadingStage.value = ''
  loadingProgress.value = 0
  loadingSize.value = { loaded: 0, total: 0 }

  if (success) {
    const endTime = new Date()
    const totalTime = endTime.getTime() - startTime.value.getTime()
    const modelName = await saveModel(undefined, startTime.value, totalTime, totalBatches.value)
    message.success('模型训练完成并已保存！')
    if (modelName)
      emit('saved', modelName)
  }
  else {
    message.error('模型训练失败或已取消')
  }
}

function handleCancelTraining() {
  cancelTraining()
  message.warning('训练已取消')
}

watch(() => store.trainingProgress.epoch, (epoch) => {
  if (epoch === 1 && !trainingStartTime.value) {
    trainingStartTime.value = Date.now()
  }
  if (epoch > 0 && trainingStartTime.value) {
    const elapsed = Date.now() - trainingStartTime.value
    const avgTimePerEpoch = elapsed / epoch
    const remainingEpochs = epochs.value - epoch
    const estimated = avgTimePerEpoch * remainingEpochs
    estimatedTimeLeft.value = formatTime(estimated)
  }
})

watch(() => store.trainingProgress.batch, (batch) => {
  if (batch > totalBatches.value) {
    totalBatches.value = batch
  }
})

watch(() => store.trainingProgress.history, (history) => {
  if (!chartRef.value)
    return

  if (!chart) {
    chart = echarts.init(chartRef.value)
    chart.setOption({
      title: {
        text: '训练进度',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((item: any) => {
            const value = item.seriesName.includes('准确率')
              ? `${(item.value * 100).toFixed(2)}%`
              : item.value.toFixed(4)
            result += `${item.marker}${item.seriesName}: ${value}<br/>`
          })
          return result
        },
      },
      legend: {
        data: ['训练损失', '训练准确率', '验证损失', '验证准确率'],
        top: 30,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: [],
        boundaryGap: false,
      },
      yAxis: [
        {
          type: 'value',
          name: '损失',
          position: 'left',
          axisLabel: {
            formatter: (value: number) => value.toFixed(2),
          },
        },
        {
          type: 'value',
          name: '准确率',
          position: 'right',
          axisLabel: {
            formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
          },
          min: 0,
          max: 1,
        },
      ],
      series: [
        {
          name: '训练损失',
          type: 'line',
          yAxisIndex: 0,
          data: [],
          smooth: true,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 2 },
        },
        {
          name: '验证损失',
          type: 'line',
          yAxisIndex: 0,
          data: [],
          smooth: true,
          itemStyle: { color: '#f97316' },
          lineStyle: { width: 2 },
        },
        {
          name: '训练准确率',
          type: 'line',
          yAxisIndex: 1,
          data: [],
          smooth: true,
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 2 },
        },
        {
          name: '验证准确率',
          type: 'line',
          yAxisIndex: 1,
          data: [],
          smooth: true,
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 2 },
        },
      ],
    })
  }

  chart.setOption({
    xAxis: {
      data: history.loss.map((_, i) => `Epoch ${i + 1}`),
    },
    series: [
      { data: history.loss },
      { data: history.valLoss },
      { data: history.accuracy },
      { data: history.valAccuracy },
    ],
  })
}, { deep: true })

onUnmounted(() => {
  chart?.dispose()
})
</script>

<template>
  <div flex flex-col gap-4>
    <div p-4 rounded-lg bg-blue-50 dark:bg-blue-900>
      <h3 text-lg font-semibold mb-3 dark:text-white>
        训练参数
      </h3>
      <NSpace vertical>
        <div flex gap-3 items-center>
          <span w-24 dark:text-gray-200>训练轮数:</span>
          <NInputNumber v-model:value="epochs" :min="1" :max="50" />
        </div>
        <div flex gap-3 items-center>
          <span w-24 dark:text-gray-200>批次大小:</span>
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

      <NButton
        v-if="store.isTraining"
        type="error"
        mt-2 block
        @click="handleCancelTraining"
      >
        取消训练
      </NButton>
    </div>

    <div v-if="loadingStage" mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900>
      <div text-sm mb-2 flex items-center justify-between dark:text-gray-200>
        <span>{{ loadingStage }}</span>
        <span v-if="loadingSize.total > 0" whitespace-nowrap>{{ formatBytes(loadingSize.loaded) }} / {{ formatBytes(loadingSize.total) }}</span>
      </div>
      <NProgress :percentage="Number(loadingProgress.toFixed(1))" :show-indicator="false" />
    </div>

    <div v-if="store.isTraining || store.trainingProgress.epoch > 0" p-4 rounded-lg bg-gray-50 dark:bg-gray-700>
      <h3 text-lg font-semibold mb-3 dark:text-white>
        训练进度
      </h3>

      <div v-if="store.isTraining" mb-4>
        <div text-sm mb-2 flex items-center justify-between dark:text-gray-200>
          <span>训练轮次进度</span>
          <span whitespace-nowrap>{{ store.trainingProgress.epoch }} / {{ epochs }} {{ estimatedTimeLeft ? `(剩余 ${estimatedTimeLeft})` : '' }}</span>
        </div>
        <NProgress :percentage="Number(((store.trainingProgress.epoch / epochs) * 100).toFixed(1))" :show-indicator="false" />
      </div>

      <div text-sm flex flex-col gap-2 dark:text-gray-200>
        <div>当前轮次: {{ store.trainingProgress.epoch }} / {{ epochs }}</div>
        <div>当前批次: {{ store.trainingProgress.batch }}</div>
        <div>训练损失: {{ store.trainingProgress.loss.toFixed(4) }}</div>
        <div>训练准确率: {{ (store.trainingProgress.accuracy * 100).toFixed(2) }}%</div>
        <div>验证损失: {{ store.trainingProgress.valLoss.toFixed(4) }}</div>
        <div>验证准确率: {{ (store.trainingProgress.valAccuracy * 100).toFixed(2) }}%</div>
      </div>

      <div ref="chartRef" mt-4 h-80 w-full />
    </div>
  </div>
</template>
