<script setup lang="ts">
import type { EChartsCoreOption } from 'echarts'
import AlarmList from '~/components/AlarmList.vue'
import TheDashboardTitle from '~/components/TheDashboardTitle.vue'
import TheMainBoard from '~/components/TheMainBoard.vue'
import TheSubBoard from '~/components/TheSubBoard.vue'
import useECharts from '~/composables/useEcharts'

function handleDashboardIconClick() {
}
const lineChartRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const lineChartOptions: ComputedRef<EChartsCoreOption> = computed(() => {
  const lineXData = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const lineData = [
    { date: '2024-04-25', timeCount: 1877, peopleCount: 331 },
    { date: '2024-04-24', timeCount: 975, peopleCount: 325 },
    { date: '2024-04-23', timeCount: 670, peopleCount: 621 },
    { date: '2024-04-22', timeCount: 124, peopleCount: 1231 },
    { date: '2024-04-21', timeCount: 325, peopleCount: 518 },
    { date: '2024-04-20', timeCount: 1325, peopleCount: 90 },
    { date: '2024-04-19', timeCount: 590, peopleCount: 987 },
  ]
  return {
    backgroundColor: 'transparent',
    legend: {
      top: '5%',
      right: '5%',
      itemWidth: 30,
      itemGap: 20,
      textStyle: {
        color: 'rgba(255, 255, 255, 1)',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        label: {
          show: true,
          backgroundColor: '#fff',
          color: '#556677',
          borderColor: 'rgba(0,0,0,0)',
          shadowColor: 'rgba(0,0,0,0)',
          shadowOffsetY: 0,
        },
        lineStyle: {
          width: 0,
        },
      },
      backgroundColor: '#fff',
      textStyle: {
        color: '#5c6c7c',
      },
      padding: [10, 10],
      extraCssText: 'box-shadow: 1px 0 2px 0 rgba(163,163,163,0.5)',
    },
    grid: {
      top: '15%',
    },
    xAxis: [{
      type: 'category',
      data: lineXData,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.25)', // x轴颜色
        },
      },
      axisTick: {
        show: true,
      },
      axisLabel: {
        interval: 0,
        textStyle: {
          color: 'rgba(225, 236, 255, 1)', // 坐标轴字颜色
        },
        margin: 15,
      },
      axisPointer: {
        label: {
          padding: [11, 5, 7],
          backgroundColor: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: '#fff', // 0% 处的颜色
            }, {
              offset: 0.9,
              color: '#fff', // 0% 处的颜色
            }, {
              offset: 0.9,
              color: '#33c0cd', // 0% 处的颜色
            }, {
              offset: 1,
              color: '#33c0cd', // 100% 处的颜色
            }],
            global: false, // 缺省为 false
          },
        },
      },
      boundaryGap: false,
    }],
    yAxis: [{
      type: 'value',
      axisTick: {
        show: false,
      },
      axisLabel: {
        textStyle: {
          color: 'rgba(255, 255, 255, 1)',
        },
      },
      splitLine: {
        show: false,
      },
    }],
    series: [{
      name: '同比变化率',
      type: 'line',
      data: lineData.map(item => item.timeCount),
      symbolSize: 10,
      symbol: 'circle',
      smooth: false,
      yAxisIndex: 0,
      showSymbol: true,
      lineStyle: {
        width: 6,
        color: 'rgba(0, 255, 255, 1)',
        shadowColor: 'rgba(0, 255, 255, 0.15)',
        shadowBlur: 4,
        shadowOffsetY: 8,
      },
      itemStyle: {
        color: 'rgba(255, 255, 255, 1)',
        borderColor: 'rgba(0, 255, 255, 1)',
        borderWidth: 2,
        shadowColor: 'rgba(0, 255, 255, 1)',
        shadowOffsetY: 4,
        shadowBlur: 4,
      },
    }, {
      name: '环比变化率',
      type: 'line',
      data: lineData.map(item => item.peopleCount),
      symbolSize: 10,
      symbol: 'circle',
      smooth: false,
      yAxisIndex: 0,
      showSymbol: true,
      lineStyle: {
        width: 6,
        color: 'rgba(0, 146, 255, 1)',
        shadowColor: 'rgba(0, 146, 255, 0.3)',
        shadowBlur: 4,
        shadowOffsetY: 8,
      },
      itemStyle: {
        color: 'rgba(255, 255, 255, 1)',
        borderColor: 'rgba(0, 146, 255, 1)',
        borderWidth: 2,
        shadowColor: 'rgba(57, 171, 255, 1)',
        shadowOffsetY: 4,
        shadowBlur: 4,
      },
    }],
  }
})
const { initChart: initLineChart } = useECharts(lineChartRef, lineChartOptions)
// 报警数据列表
const alarmList = [
  {
    deviceId: '866374062615457',
    reason: '设备无法正常运行',
    time: '2025.11.02 10:15:21',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615458',
    reason: '温度传感器异常',
    time: '2025.11.02 10:12:30',
    status: '警告' as const,
  },
  {
    deviceId: '866374062615459',
    reason: '电压波动过大',
    time: '2025.11.02 10:08:45',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615460',
    reason: '网络连接中断',
    time: '2025.11.02 10:05:12',
    status: '警告' as const,
  },
  {
    deviceId: '866374062615461',
    reason: '设备运行超时',
    time: '2025.11.02 10:01:33',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615462',
    reason: '湿度异常升高',
    time: '2025.11.02 09:58:15',
    status: '警告' as const,
  },
  {
    deviceId: '866374062615463',
    reason: '电源模块故障',
    time: '2025.11.02 09:55:42',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615464',
    reason: '通信信号弱',
    time: '2025.11.02 09:52:27',
    status: '警告' as const,
  },
]

const deviceList = ref([{
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}, {
  name: 'W200PG',
  infos: [{
    label: '设备位置：',
    value: '门诊楼机房-冷水机组',
  }, {
    label: '实时能耗：',
    value: '5.92',
  }, {
    label: '运行状态：',
    value: '正常运行',
  }, {
    label: '运行时常：',
    value: '5.2天',
  }, {
    label: '通信状态：',
    value: '正常',
  }],
}])

const maintainList = ref([{
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 1,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 1,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 1,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 2,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 2,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 2,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 3,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 3,
}, {
  name: 'W200PG',
  lastTime: '2025-11-01',
  nextTime: '2025-12-01',
  status: 3,
}])

onMounted(() => {
  initLineChart()
})
</script>

<template>
  <TheDashboardTitle
    title="能耗综合管理系统"
    @icon-click="handleDashboardIconClick"
  />
  <div flex="~ col" h-screen>
    <div shrink-0 h-105px />
    <div p-4 flex-1 gap-4 grid grid-cols-4 h-screen>
      <div flex flex-col gap-4 col-span-1>
        <div rounded flex-1>
          <TheMainBoard title="机电子系统检测">
            <div h-full w-full flex="~ col">
              <TheSubBoard title="昨日概括">
                <div
                  grid="~ rows-1 cols-2" gap-10
                >
                  <ThePercentageRing :value="96" title="能耗数值(总量)" type="orange" />
                  <ThePercentageRing :value="4" title="能耗数值(单平)" type="blue" />
                </div>
              </TheSubBoard>
              <TheSubBoard title="近一周" style="height:300px;">
                <div ref="lineChartRef" h-full w-full />
              </TheSubBoard>
            </div>
          </TheMainBoard>
        </div>
        <div flex-1>
          <TheMainBoard title="系统报警管理">
            <AlarmList :list="alarmList" />
          </TheMainBoard>
        </div>
      </div>
      <div flex flex-col gap-4 col-span-3>
        <div flex="[2]">
          <TheMainBoard title="重点设备监测">
            <div flex flex-wrap flex-justify-between flex-items-center style="height:100%">
              <div v-for="(device, i) in deviceList" :key="i" class="d-items bg" text="white" line-height-24px mr-30px pb-10px pl-20px pr-20px pt-10px>
                <div class="device-name" font-bold>
                  设备名称：{{ device.name }}
                </div>
                <div flex flex-justify-between flex-items-end>
                  <div flex flex-items-center>
                    <img src="../../assets/images/d-img.png" width="60" height="55" mr-10px alt="" style="height:55px">
                    <div class="device-infos">
                      <div v-for="(info, index) in device.infos" :key="`info${index}`" class="info" text="13px #cfd4db">
                        <label>{{ info.label }}</label>
                        <span>{{ info.value }}</span>
                      </div>
                    </div>
                  </div>
                  <NButton type="info" size="small" class="bg-#3f9ef6">
                    定位
                  </NButton>
                </div>
              </div>
            </div>
          </TheMainBoard>
        </div>
        <div flex="[1]">
          <TheMainBoard title="设备维护管理">
            <div flex flex-wrap flex-justify-between flex-items-center style="height:100%">
              <div v-for="(item, i) in maintainList" :key="`i${i}`" class="d-items" text="white" mr-10px pb-10px pl-20px pr-20px pt-10px flex>
                <img src="../../assets/images/d-left-img.png" width="20" height="65" mr-5px alt="">
                <div>
                  <div p2 flex flex-justify-between flex-items-center class="bg-[linear-gradient(270deg,rgba(43,85,167,0.03)_0%,rgba(7,118,221,0.29)_100%)]">
                    <div flex flex-items-center>
                      <img src="../../assets/images/d-icon.png" width="20" height="28" pr-5px alt="">
                      <span text="white" font-bold>设备名称：{{ item.name }}</span>
                    </div>
                    <NButton size="small" strong ghost round :type="(item.status === 1) ? 'primary' : (item.status === 2 ? 'warning' : 'error')">
                      {{ item.status === 1 ? '无需维护' : (item.status === 2 ? '待维护' : '超时未维护') }}
                    </NButton>
                  </div>
                  <div mt-10px class="font-12px">
                    <span text="white" ml-10px>上次维护时间：{{ item.lastTime }}</span>
                    <span text="white" ml-10px>下次维护时间：{{ item.nextTime }}</span>
                  </div>
                </div>
                <img src="../../assets/images/d-right-img.png" width="20" height="65" ml-5px alt="">
              </div>
            </div>
          </TheMainBoard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.d-items {
  flex: 1 1 30%;
}
.bg {
  background: linear-gradient(270deg, rgba(43, 85, 167, 0.03) 0%, rgba(7, 118, 221, 0.29) 100%);
  border-left: 4px solid #bfd8ff;
}
.yesterday-overview-item {
  width: 160px;
}
</style>

<route lang="yaml">
meta:
  layout: 'default'
  menu:
    title: '能耗综合管理系统'
</route>
