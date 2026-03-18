<script setup lang="ts">
import type { EChartsCoreOption } from 'echarts'
import type { CollatzAnalysis, CollatzTerm } from './composables/types'
import { analyzeCollatz, COLLATZ_DEFAULT_MAX_STEPS, COLLATZ_MAX_START, COLLATZ_MIN_START } from './composables/collatzMath'

defineOptions({
  name: 'CollatzConjecturePage',
})

const presets = [7, 27, 97, 871]
const inputValue = ref<number | null>(27)
const chartRef = ref<HTMLElement | null>(null)
const numberFormatter = new Intl.NumberFormat('zh-CN')

const validationError = computed(() => {
  const value = inputValue.value

  if (value === null || Number.isNaN(value))
    return '请输入一个正整数作为冰雹序列的起点。'
  if (!Number.isInteger(value))
    return '只支持整数输入，小数不会参与演算。'
  if (value < COLLATZ_MIN_START)
    return '起点必须大于或等于 1。'
  if (value > COLLATZ_MAX_START)
    return `为了保证图表与移动端可读性，起点不能超过 ${formatNumber(COLLATZ_MAX_START)}。`

  return ''
})

const analysis = computed<CollatzAnalysis | null>(() => {
  if (validationError.value)
    return null

  return analyzeCollatz(inputValue.value!, { maxSteps: COLLATZ_DEFAULT_MAX_STEPS })
})

const summaryCards = computed(() => {
  if (!analysis.value)
    return []

  const current = analysis.value

  return [
    {
      key: 'steps',
      label: '总步数',
      value: formatNumber(current.steps),
      note: current.truncated ? '达到保护上限' : '从起点走到终点',
    },
    {
      key: 'peak-value',
      label: '峰值',
      value: formatNumber(current.peakValue),
      note: '整个序列中出现的最大值',
    },
    {
      key: 'peak-step',
      label: '峰值位置',
      value: `第 ${formatNumber(current.peakStep)} 步`,
      note: '第一次到达峰值的时刻',
    },
    {
      key: 'sequence-length',
      label: '序列项数',
      value: formatNumber(current.sequence.length),
      note: '包含起点与终点',
    },
    {
      key: 'odd-count',
      label: '奇数项',
      value: formatNumber(current.oddCount),
      note: '序列中所有奇数项数量',
    },
    {
      key: 'even-count',
      label: '偶数项',
      value: formatNumber(current.evenCount),
      note: '序列中所有偶数项数量',
    },
  ]
})

const sequencePreview = computed(() => {
  if (!analysis.value)
    return ''

  const values = analysis.value.sequence.map(term => formatNumber(term.value))
  if (values.length <= 8)
    return values.join(' → ')

  return `${values.slice(0, 5).join(' → ')} → ... → ${values.slice(-3).join(' → ')}`
})

const chartOptions = computed<EChartsCoreOption>(() => {
  const axisLabelColor = isDark.value ? '#94a3b8' : '#475569'
  const splitLineColor = isDark.value ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.2)'
  const borderColor = isDark.value ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.24)'
  const lineColor = isDark.value ? '#38bdf8' : '#2563eb'
  const areaStart = isDark.value ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.28)'
  const areaEnd = isDark.value ? 'rgba(56, 189, 248, 0.04)' : 'rgba(37, 99, 235, 0.03)'

  if (!analysis.value) {
    return {
      animation: false,
      grid: {
        left: '8%',
        right: '6%',
        top: '12%',
        bottom: '14%',
      },
      xAxis: {
        type: 'value',
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      tooltip: { show: false },
      series: [],
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '输入 1 到 1,000,000 之间的正整数，图表会在这里生成。',
          fill: axisLabelColor,
          fontSize: 16,
          fontWeight: 500,
          textAlign: 'center',
        },
      },
    }
  }

  const current = analysis.value
  const startTerm = current.sequence[0]
  const peakTerm = current.sequence[current.peakStep]
  const endTerm = current.sequence[current.sequence.length - 1]

  return {
    animationDuration: 450,
    tooltip: {
      trigger: 'axis',
      formatter(params: any) {
        const point = Array.isArray(params) ? params[0] : params
        if (!point?.data)
          return ''

        const [step, value] = point.data as [number, number]
        return `第 ${formatNumber(step)} 步<br/>数值：${formatNumber(value)}`
      },
    },
    grid: {
      left: '8%',
      right: '5%',
      top: '14%',
      bottom: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '步数',
      minInterval: 1,
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: {
        color: axisLabelColor,
        formatter: (value: number) => formatNumber(value),
      },
      axisLine: {
        lineStyle: { color: borderColor },
      },
      splitLine: { show: false },
      nameTextStyle: { color: axisLabelColor },
    },
    yAxis: {
      type: 'value',
      name: '数值',
      scale: true,
      axisLabel: {
        color: axisLabelColor,
        formatter: (value: number) => formatNumber(value),
      },
      axisLine: {
        lineStyle: { color: borderColor },
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
        },
      },
      nameTextStyle: { color: axisLabelColor },
    },
    series: [{
      type: 'line',
      smooth: false,
      showSymbol: false,
      data: current.sequence.map(term => [term.step, term.value]),
      lineStyle: {
        width: 3,
        color: lineColor,
      },
      itemStyle: {
        color: lineColor,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: areaStart },
            { offset: 1, color: areaEnd },
          ],
        },
      },
      markPoint: {
        symbol: 'pin',
        symbolSize: 56,
        label: {
          formatter: '{b}',
          fontWeight: 700,
        },
        data: [
          {
            name: '起点',
            xAxis: startTerm.step,
            yAxis: startTerm.value,
            itemStyle: { color: '#14b8a6' },
          },
          {
            name: '峰值',
            xAxis: peakTerm.step,
            yAxis: peakTerm.value,
            itemStyle: { color: '#ef4444' },
          },
          {
            name: current.reachedOne ? '终点 1' : '已截断',
            xAxis: endTerm.step,
            yAxis: endTerm.value,
            itemStyle: { color: current.reachedOne ? '#2563eb' : '#f97316' },
          },
        ],
      },
    }],
  }
})

useEcharts(chartRef, chartOptions)

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function applyPreset(value: number) {
  inputValue.value = value
}

function getTermCardClass(term: CollatzTerm) {
  const current = analysis.value

  if (!current)
    return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
  if (term.step === 0)
    return 'border-teal-200 bg-teal-50 dark:border-teal-900/70 dark:bg-teal-950/40'
  if (term.step === current.peakStep)
    return 'border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/40'
  if (current.reachedOne && term.value === 1 && term.step === current.steps)
    return 'border-blue-200 bg-blue-50 dark:border-blue-900/70 dark:bg-blue-950/40'

  return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
}

function getTermLabel(term: CollatzTerm) {
  const current = analysis.value

  if (!current)
    return term.value % 2 === 0 ? '偶数项' : '奇数项'
  if (term.step === 0)
    return '起点'
  if (term.step === current.peakStep)
    return '峰值'
  if (current.reachedOne && term.value === 1 && term.step === current.steps)
    return '终点'

  return term.value % 2 === 0 ? '偶数项' : '奇数项'
}
</script>

<template>
  <div class="p-4 min-h-full from-sky-50 to-orange-50 via-white bg-gradient-to-br md:p-6 dark:from-slate-950 dark:to-slate-900 dark:via-slate-950">
    <div class="mx-auto flex flex-col gap-4 max-w-7xl md:gap-6">
      <section class="p-5 border border-white/70 rounded-3xl bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-8 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-[0_18px_60px_rgba(2,6,23,0.45)]">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-xs text-sky-600 tracking-[0.32em] font-semibold uppercase dark:text-sky-300">
              Number Theory / 教学交互
            </p>
            <h1 class="text-3xl text-slate-900 leading-tight font-black mt-2 md:text-5xl dark:text-white">
              考拉兹猜想与冰雹序列
            </h1>
            <p class="text-sm text-slate-600 leading-7 mt-3 md:text-base dark:text-slate-300">
              取任意正整数，偶数就除以 2，奇数就乘 3 再加 1。这个过程会像冰雹一样忽上忽下，
              但到目前为止，所有被验证过的起点最终都会落回 1。这个页面专门用来观察它的轨迹、峰值和收敛节奏。
            </p>
          </div>

          <div class="gap-3 grid sm:grid-cols-3">
            <div class="p-4 border border-sky-100 rounded-2xl bg-sky-50/80 min-w-[150px] dark:border-sky-900/60 dark:bg-sky-950/30">
              <div class="text-xs text-sky-700 tracking-[0.24em] uppercase dark:text-sky-300">
                偶数规则
              </div>
              <div class="text-xl text-slate-900 font-black mt-2 dark:text-white">
                n / 2
              </div>
            </div>
            <div class="p-4 border border-orange-100 rounded-2xl bg-orange-50/80 min-w-[150px] dark:border-orange-900/60 dark:bg-orange-950/30">
              <div class="text-xs text-orange-700 tracking-[0.24em] uppercase dark:text-orange-300">
                奇数规则
              </div>
              <div class="text-xl text-slate-900 font-black mt-2 dark:text-white">
                3n + 1
              </div>
            </div>
            <div class="p-4 border border-emerald-100 rounded-2xl bg-emerald-50/80 min-w-[150px] dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div class="text-xs text-emerald-700 tracking-[0.24em] uppercase dark:text-emerald-300">
                目标状态
              </div>
              <div class="text-xl text-slate-900 font-black mt-2 dark:text-white">
                回到 1
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="gap-4 grid md:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <NCard size="large" :bordered="false" embedded>
          <template #header>
            输入与预设
          </template>

          <div class="flex flex-col gap-4">
            <div>
              <div class="text-sm text-slate-700 font-medium mb-2 dark:text-slate-200">
                起点
              </div>
              <NInputNumber
                v-model:value="inputValue"
                class="w-full"
                :min="COLLATZ_MIN_START"
                :max="COLLATZ_MAX_START"
                :step="1"
                :show-button="false"
                placeholder="输入一个正整数"
              />
              <p class="text-xs text-slate-500 leading-6 mb-0 mt-2 dark:text-slate-400">
                支持范围：{{ formatNumber(COLLATZ_MIN_START) }} 到 {{ formatNumber(COLLATZ_MAX_START) }}。
              </p>
            </div>

            <div>
              <div class="text-sm text-slate-700 font-medium mb-2 dark:text-slate-200">
                经典样例
              </div>
              <div class="flex flex-wrap gap-2">
                <NButton
                  v-for="preset in presets"
                  :key="preset"
                  tertiary
                  type="primary"
                  @click="applyPreset(preset)"
                >
                  {{ formatNumber(preset) }}
                </NButton>
              </div>
            </div>

            <NAlert v-if="validationError" type="error" :show-icon="false">
              {{ validationError }}
            </NAlert>

            <NAlert v-else-if="analysis?.truncated" type="warning" :show-icon="false">
              当前序列在 {{ formatNumber(COLLATZ_DEFAULT_MAX_STEPS) }} 步后仍未结束，页面已按保护阈值截断展示。
            </NAlert>

            <div class="text-sm text-slate-600 leading-6 p-4 rounded-2xl bg-slate-100 dark:text-slate-300 dark:bg-slate-800/70">
              <div class="text-sm text-slate-900 font-semibold dark:text-white">
                当前序列预览
              </div>
              <div class="mt-2 break-all">
                {{ sequencePreview || '等待有效输入后生成序列。' }}
              </div>
            </div>
          </div>
        </NCard>

        <NCard size="large" :bordered="false" embedded>
          <template #header>
            观察提示
          </template>

          <div class="gap-4 grid md:grid-cols-2">
            <div class="p-4 border border-slate-200 rounded-2xl dark:border-slate-800">
              <div class="text-sm text-slate-900 font-semibold dark:text-white">
                为什么叫“冰雹”？
              </div>
              <p class="text-sm text-slate-600 leading-7 mb-0 mt-3 dark:text-slate-300">
                序列常常先被奇数规则抬高，再被多个偶数规则迅速砸回低位，轨迹像云中冰雹被气流抛起后又坠落。
              </p>
            </div>
            <div class="p-4 border border-slate-200 rounded-2xl dark:border-slate-800">
              <div class="text-sm text-slate-900 font-semibold dark:text-white">
                这个页面看什么？
              </div>
              <p class="text-sm text-slate-600 leading-7 mb-0 mt-3 dark:text-slate-300">
                重点看三件事：走了多少步、冲到多高、在哪一步达到峰值。它们能直观看出不同起点的“上冲”程度。
              </p>
            </div>
            <div class="p-4 border border-slate-200 rounded-2xl dark:border-slate-800">
              <div class="text-sm text-slate-900 font-semibold dark:text-white">
                结果意味着什么？
              </div>
              <p class="text-sm text-slate-600 leading-7 mb-0 mt-3 dark:text-slate-300">
                页面只能做数值实验，不能证明猜想。即使大量样例都回到 1，也不等于已经得到一般性证明。
              </p>
            </div>
            <div class="p-4 border border-slate-200 rounded-2xl dark:border-slate-800">
              <div class="text-sm text-slate-900 font-semibold dark:text-white">
                移动端策略
              </div>
              <p class="text-sm text-slate-600 leading-7 mb-0 mt-3 dark:text-slate-300">
                手机端保持纵向阅读流，先给输入和统计，再展示图和序列卡片，避免横向滚动造成信息断裂。
              </p>
            </div>
          </div>
        </NCard>
      </section>

      <section>
        <div v-if="analysis" class="gap-4 grid sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="card in summaryCards"
            :key="card.key"
            class="p-5 border border-white/70 rounded-3xl bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_12px_40px_rgba(2,6,23,0.35)]"
          >
            <div class="text-sm text-slate-500 dark:text-slate-400">
              {{ card.label }}
            </div>
            <div class="text-3xl text-slate-900 font-black mt-3 dark:text-white">
              {{ card.value }}
            </div>
            <div class="text-sm text-slate-500 leading-6 mt-2 dark:text-slate-400">
              {{ card.note }}
            </div>
          </div>
        </div>

        <NCard v-else size="large" :bordered="false" embedded>
          <NEmpty description="输入有效起点后，这里会展示步数、峰值和奇偶项统计。" />
        </NCard>
      </section>

      <section>
        <NCard size="large" :bordered="false" embedded content-style="padding: 0;">
          <template #header>
            冰雹轨迹图
          </template>
          <template #header-extra>
            <span class="text-xs text-slate-500 dark:text-slate-400">步数 -> 数值</span>
          </template>

          <div ref="chartRef" class="px-2 h-[320px] md:h-[420px]" />

          <div class="text-sm text-slate-600 leading-6 p-4 border-t border-slate-200 bg-white/70 dark:text-slate-300 dark:border-slate-800 dark:bg-slate-900/65">
            起点、峰值和终点都会被单独标记。峰值越高，说明序列在收敛前经历了更明显的“上抛”。
          </div>
        </NCard>
      </section>

      <section>
        <NCard size="large" :bordered="false" embedded>
          <template #header>
            序列明细
          </template>
          <template #header-extra>
            <span class="text-xs text-slate-500 dark:text-slate-400">逐步展开每一项</span>
          </template>

          <template v-if="analysis">
            <div class="text-sm text-slate-600 leading-6 mb-4 dark:text-slate-300">
              共 {{ formatNumber(analysis.sequence.length) }} 项，按步号展开。起点、峰值和终点会使用不同底色强调。
            </div>

            <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="term in analysis.sequence"
                :key="term.step"
                :class="getTermCardClass(term)"
                class="p-4 border rounded-2xl transition-colors duration-200"
              >
                <div class="flex gap-3 items-center justify-between">
                  <span class="text-xs text-slate-500 font-mono dark:text-slate-400">
                    Step {{ term.step }}
                  </span>
                  <span class="text-xs px-2 py-1 rounded-full bg-black/5 dark:bg-white/8">
                    {{ getTermLabel(term) }}
                  </span>
                </div>
                <div class="text-2xl text-slate-900 font-black mt-3 break-all dark:text-white">
                  {{ formatNumber(term.value) }}
                </div>
              </div>
            </div>
          </template>

          <NEmpty v-else description="有效输入后，这里会列出每一步的具体数值。" />
        </NCard>
      </section>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '考拉兹猜想（冰雹猜想）'
  description: '输入正整数，观察冰雹序列的步数、峰值与收敛过程'
  tags: ['数学', '数论', '可视化', '教学演示']
</route>
