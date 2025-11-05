<script setup lang="ts">
import * as echarts from 'echarts'
import 'echarts-gl'

const props = withDefaults(defineProps<Props>(), {
  internalDiameterRatio: 0.8,
})

const colorList = ['#209fed', '#ff6b6b', '#ffa726']

interface PieData {
  name: string
  value: number
  itemStyle?: {
    color?: string
    opacity?: number
  }
}

interface Props {
  data: PieData[]
  internalDiameterRatio?: number
}

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

// 生成扇形的曲面参数方程，用于 series-surface.parametricEquation
function getParametricEquation(startRatio: number, endRatio: number, isSelected: boolean, isHovered: boolean, k: number, h: number) {
  // 计算
  const midRatio = (startRatio + endRatio) / 2

  const startRadian = startRatio * Math.PI * 2
  const endRadian = endRatio * Math.PI * 2
  const midRadian = midRatio * Math.PI * 2

  // 如果只有一个扇形，则不实现选中效果。
  // if (startRatio === 0 && endRatio === 1) {
  //     isSelected = false;
  // }
  isSelected = false
  // 通过扇形内径/外径的值，换算出辅助参数 k（默认值 1/3）
  k = typeof k !== 'undefined' ? k : 1 / 3

  // 计算选中效果分别在 x 轴、y 轴方向上的位移（未选中，则位移均为 0）
  const offsetX = isSelected ? Math.sin(midRadian) * 0.1 : 0
  const offsetY = isSelected ? Math.cos(midRadian) * 0.1 : 0

  // 计算高亮效果的放大比例（未高亮，则比例为 1）
  const hoverRate = isHovered ? 1.05 : 1

  // 返回曲面参数方程
  return {
    u: {
      min: -Math.PI,
      max: Math.PI * 3,
      step: Math.PI / 32,
    },

    v: {
      min: 0,
      max: Math.PI * 2,
      step: Math.PI / 20,
    },

    x(u: number, v: number) {
      if (u < startRadian) {
        return offsetX + Math.cos(startRadian) * (1 + Math.cos(v) * k) * hoverRate
      }
      if (u > endRadian) {
        return offsetX + Math.cos(endRadian) * (1 + Math.cos(v) * k) * hoverRate
      }
      return offsetX + Math.cos(u) * (1 + Math.cos(v) * k) * hoverRate
    },

    y(u: number, v: number) {
      if (u < startRadian) {
        return offsetY + Math.sin(startRadian) * (1 + Math.cos(v) * k) * hoverRate
      }
      if (u > endRadian) {
        return offsetY + Math.sin(endRadian) * (1 + Math.cos(v) * k) * hoverRate
      }
      return offsetY + Math.sin(u) * (1 + Math.cos(v) * k) * hoverRate
    },

    z(u: number, v: number) {
      if (u < -Math.PI * 0.5) {
        return Math.sin(u)
      }
      if (u > Math.PI * 2.5) {
        return Math.sin(u) * h * 0.1
      }
      return Math.sin(v) > 0 ? 1 * h * 0.1 : -1
    },
  }
}

// 生成模拟 3D 饼图的配置项
function getPie3D(pieData: PieData[], internalDiameterRatio: number) {
  const series: any[] = []
  let sumValue = 0
  let startValue = 0
  let endValue = 0
  const legendData: string[] = []
  const k
      = typeof internalDiameterRatio !== 'undefined'
        ? (1 - internalDiameterRatio) / (1 + internalDiameterRatio)
        : 1 / 3

  // 为每一个饼图数据，生成一个 series-surface 配置
  for (let i = 0; i < pieData.length; i++) {
    sumValue += pieData[i].value

    const seriesItem = {
      name: typeof pieData[i].name === 'undefined' ? `series${i}` : pieData[i].name,
      type: 'surface',
      parametric: true,
      wireframe: {
        show: false,
      },
      pieData: pieData[i],
      pieStatus: {
        selected: false,
        hovered: false,
        k: 1 / 10,
      },
      itemStyle: {
        color: colorList[i % colorList.length],
      },
    }

    if (typeof pieData[i].itemStyle !== 'undefined') {
      const itemStyle: any = {}

      if (typeof pieData[i].itemStyle?.color !== 'undefined') {
        itemStyle.color = pieData[i].itemStyle.color
      }
      if (typeof pieData[i].itemStyle?.opacity !== 'undefined') {
        itemStyle.opacity = pieData[i].itemStyle.opacity
      }

      seriesItem.itemStyle = { ...seriesItem.itemStyle, ...itemStyle }
    }
    series.push(seriesItem)
  }

  // 使用上一次遍历时，计算出的数据和 sumValue，调用 getParametricEquation 函数，
  // 向每个 series-surface 传入不同的参数方程 series-surface.parametricEquation，也就是实现每一个扇形。
  for (let i = 0; i < series.length; i++) {
    endValue = startValue + series[i].pieData.value

    series[i].pieData.startRatio = startValue / sumValue
    series[i].pieData.endRatio = endValue / sumValue
    series[i].parametricEquation = getParametricEquation(
      series[i].pieData.startRatio,
      series[i].pieData.endRatio,
      false,
      false,
      k,
      series[i].pieData.value,
    )

    startValue = endValue

    legendData.push(series[i].name)
  }

  // // 补充一个透明的圆环，用于支撑高亮功能的近似实现。
  series.push({
    name: 'mouseoutSeries',
    type: 'surface',
    parametric: true,
    wireframe: {
      show: false,
    },
    itemStyle: {
      opacity: 0.1,
      color: '#E1E8EC',
    },
    parametricEquation: {
      u: {
        min: 0,
        max: Math.PI * 2,
        step: Math.PI / 20,
      },
      v: {
        min: 0,
        max: Math.PI,
        step: Math.PI / 20,
      },
      x(u: number, v: number) {
        return ((Math.sin(v) * Math.sin(u) + Math.sin(u)) / Math.PI) * 2
      },
      y(u: number, v: number) {
        return ((Math.sin(v) * Math.cos(u) + Math.cos(u)) / Math.PI) * 2
      },
      z(u: number, v: number) {
        return Math.cos(v) > 0 ? -0.5 : -5
      },
    },
  })

  // // 补充一个透明的圆环，用于支撑高亮功能的近似实现。
  series.push({
    name: 'mouseoutSeries',
    type: 'surface',
    parametric: true,
    wireframe: {
      show: false,
    },
    itemStyle: {
      opacity: 0.1,
      color: 'rgba(101, 153, 164, 0.24)',
    },
    parametricEquation: {
      u: {
        min: 0,
        max: Math.PI * 2,
        step: Math.PI / 20,
      },
      v: {
        min: 0,
        step: Math.PI / 20,
      },
      x(u: number, v: number) {
        return ((Math.sin(v) * Math.sin(u) + Math.sin(u)) / Math.PI) * 2
      },
      y(u: number, v: number) {
        return ((Math.sin(v) * Math.cos(u) + Math.cos(u)) / Math.PI) * 2
      },
      z(u: number, v: number) {
        return Math.cos(v) > 0 ? -5 : -7
      },
    },
  })
  series.push({
    name: 'mouseoutSeries',
    type: 'surface',

    parametric: true,
    wireframe: {
      show: false,
    },
    itemStyle: {
      opacity: 0.1,
      color: '#E1E8EC',
    },
    parametricEquation: {
      u: {
        min: 0,
        max: Math.PI * 2,
        step: Math.PI / 20,
      },
      v: {
        min: 0,
        max: Math.PI,
        step: Math.PI / 20,
      },
      x(u: number, v: number) {
        return ((Math.sin(v) * Math.sin(u) + Math.sin(u)) / Math.PI) * 2.2
      },
      y(u: number, v: number) {
        return ((Math.sin(v) * Math.cos(u) + Math.cos(u)) / Math.PI) * 2.2
      },
      z(u: number, v: number) {
        return Math.cos(v) > 0 ? -7 : -7
      },
    },
  })

  // 准备待返回的配置项，把准备好的 legendData、series 传入。
  const option = {
    // animation: false,
    backgroundColor: 'transparent',
    // backgroundColor: 'red',
    fontFamily: 'PangMenZhengDao',
    legend: {
      icon: 'circle',
      orient: 'vertical',
      data: pieData.map((dItem, dIndex) => {
        return {
          ...dItem,
          textStyle: {
            rich: {
              percent: {
                color: colorList[dIndex],
              },
            },
          },

        }
      }),
      right: '5%',
      top: 'middle',
      // itemGap: 30,
      itemWidth: 12,
      itemHeight: 12,
      selectedMode: true,
      textStyle: {
        color: '#fff',
        // fontSize: 28,
        fontFamily: 'PangMenZhengDao',
        rich: {
          name: {
            fontFamily: 'PangMenZhengDao',
            width: 40,
            padding: [0, 0, 0, 10],
          },
          value: {
            fontFamily: 'PangMenZhengDao',
            width: 20,
            padding: [0, 0, 0, 30],
          },
          percent: {
            fontFamily: 'PangMenZhengDao',
            width: 15,
            padding: [0, 0, 0, 30],
          },
          unit: {
            fontFamily: 'PangMenZhengDao',
            width: 10,
            padding: [0, 0, 0, 5],
          },
        },
      },
      formatter: (name: string) => {
        const obj = pieData.find(item => item.name === name)
        const datas = pieData
        let total = 0
        const target = obj?.value || 0
        for (let i = 0; i < datas.length; i++) {
          total += Number(datas[i].value)
        }
        const arr = [
          `{iconName|}{name|${name}}{percent|${((target / total) * 100).toFixed(0)}}{unit|%}`,
        ]
        return arr.join('')
      },
    },

    xAxis3D: {},
    yAxis3D: {},
    zAxis3D: {},
    grid3D: {
      viewControl: {
        autoRotate: true, // 自动旋转
        distance: 140, // 减小观察距离来放大图表
      },
      left: '2%',
      width: '50%',
      show: false,
      boxHeight: 80,
    },
    series,
  }
  return option
}

function initChart() {
  if (!chartRef.value)
    return

  chart = echarts.init(chartRef.value)

  const option = getPie3D(props.data, props.internalDiameterRatio)
  chart.setOption(option)
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})

watch(() => props.data, () => {
  initChart()
}, { deep: true })
</script>

<template>
  <div ref="chartRef" class="pie-3d-chart" />
</template>

<style scoped>
.pie-3d-chart {
  width: 100%;
  height: 100%;
}
</style>
