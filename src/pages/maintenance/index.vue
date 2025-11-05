<script setup lang="ts">
import type { EChartsCoreOption } from 'echarts'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable } from 'naive-ui'
import { h } from 'vue'
import TheDashboardTitle from '~/components/TheDashboardTitle.vue'
import TheMainBoard from '~/components/TheMainBoard.vue'
import TheSubBoard from '~/components/TheSubBoard.vue'
import useECharts from '~/composables/useEcharts'
import TheStatsCard from './components/TheStatsCard.vue'
import TheWorkOrderItem from './components/TheWorkOrderItem.vue'

interface RepairCategory {
  /** 报修类别编码 */
  categoryCode: string

  /** 报修类别名称 */
  categoryName: string

  /** 维修科室 */
  maintenanceDepartment: string

  /** 标准处理时限 */
  standardProcessingTime: string

  /** 类别状态 */
  status: string

  /** 未处理数 */
  pendingCount: number

  /** 优先级等级 */
  priorityLevel: number
}

interface WorkOrder {
  /** 工单号 */
  workOrderNumber: string

  /** 报修人 */
  reporter: string

  /** 报修科室 */
  department: string

  /** 报修电话 */
  phone: string

  /** 设备名称 */
  deviceName: string

  /** 故障描述 */
  faultDescription: string

  /** 维修费用 */
  repairCost: number

  /** 维修完成情况 */
  repairStatus: number
}

const lineChartRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null)
const lineChartOptions: ComputedRef<EChartsCoreOption> = computed(() => {
  const lineXData = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const lineData = [
    { date: '2025-10-28', timeCount: 45, peopleCount: 5 },
    { date: '2025-10-29', timeCount: 38, peopleCount: 7 },
    { date: '2025-10-30', timeCount: 42, peopleCount: 3 },
    { date: '2025-10-31', timeCount: 35, peopleCount: 10 },
    { date: '2025-11-01', timeCount: 48, peopleCount: 2 },
    { date: '2025-11-02', timeCount: 40, peopleCount: 5 },
    { date: '2025-11-03', timeCount: 36, peopleCount: 4 },
  ]
  return {
    backgroundColor: 'transparent',
    legend: {
      icon: 'rect',
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
      name: '已回访',
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
      name: '未回访',
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
const pagination = false as const

const statsList = ref([
  { title: '未处理工单总数', value: 45, icon: 'i-carbon-user-multiple' },
  { title: '待审计工单数', value: 8, icon: 'i-carbon-user-multiple' },
  { title: '今日新增工单', value: 12, icon: 'i-carbon-user-multiple' },
  { title: '平均满意度评分', value: 9.2, icon: 'i-carbon-user-multiple' },
])

const repairCategoryData: RepairCategory[] = [
  {
    categoryCode: 'BX-001',
    categoryName: '电气设备故障',
    maintenanceDepartment: '电工班',
    standardProcessingTime: '2h/1天',
    status: '启用中',
    pendingCount: 15,
    priorityLevel: 1,
  },
  {
    categoryCode: 'BX-002',
    categoryName: '空调系统故障',
    maintenanceDepartment: '空调班',
    standardProcessingTime: '4h/1天',
    status: '启用中',
    pendingCount: 8,
    priorityLevel: 1,
  },
  {
    categoryCode: 'BX-003',
    categoryName: '医疗设备故障',
    maintenanceDepartment: '设备科',
    standardProcessingTime: '8h/2天',
    status: '启用中',
    pendingCount: 12,
    priorityLevel: 2,
  },
  {
    categoryCode: 'BX-004',
    categoryName: '网络通信故障',
    maintenanceDepartment: '信息科',
    standardProcessingTime: '1h/1天',
    status: '启用中',
    pendingCount: 6,
    priorityLevel: 2,
  },
]

const workOrderData: WorkOrder[] = [
  {
    workOrderNumber: 'WG-2025110301',
    reporter: '张明',
    department: '手术室',
    phone: '138****1234',
    deviceName: '手术室空调',
    faultDescription: '温度控制异常',
    repairCost: 1200.00,
    repairStatus: 1,
  },
  {
    workOrderNumber: 'WG-2025110302',
    reporter: '李华',
    department: 'ICU病房',
    phone: '139****5678',
    deviceName: '监护仪',
    faultDescription: '信号传输不稳定',
    repairCost: 850.50,
    repairStatus: 0,
  },
  {
    workOrderNumber: 'WG-2025110303',
    reporter: '王芳',
    department: '急诊科',
    phone: '137****9012',
    deviceName: '除颤仪',
    faultDescription: '电池续航不足',
    repairCost: 320.00,
    repairStatus: 1,
  },
  {
    workOrderNumber: 'WG-2025110304',
    reporter: '赵伟',
    department: '检验科',
    phone: '136****3456',
    deviceName: '离心机',
    faultDescription: '转速异常',
    repairCost: 1500.00,
    repairStatus: 0,
  },
  {
    workOrderNumber: 'WG-2025110305',
    reporter: '刘洋',
    department: '放射科',
    phone: '135****7890',
    deviceName: 'CT设备',
    faultDescription: '图像重建失败',
    repairCost: 2800.00,
    repairStatus: 1,
  },
  {
    workOrderNumber: 'WG-2025110306',
    reporter: '陈明',
    department: '药房',
    phone: '134****2345',
    deviceName: '冷藏柜',
    faultDescription: '温度显示异常',
    repairCost: 680.00,
    repairStatus: 0,
  },
  // {
  //   workOrderNumber: 'WG-2025110307',
  //   reporter: '张丽',
  //   department: '住院部',
  //   phone: '133****6789',
  //   deviceName: '呼叫系统',
  //   faultDescription: '按钮无响应',
  //   repairCost: 450.00,
  //   repairStatus: 1,
  // },
  // {
  //   workOrderNumber: 'WG-2025110308',
  //   reporter: '王刚',
  //   department: '门诊部',
  //   phone: '132****0123',
  //   deviceName: '打印机',
  //   faultDescription: '卡纸故障',
  //   repairCost: 180.00,
  //   repairStatus: 0,
  // },
  // {
  //   workOrderNumber: 'WG-2025110309',
  //   reporter: '周强',
  //   department: '手术室',
  //   phone: '131****4567',
  //   deviceName: '麻醉机',
  //   faultDescription: '气体泄漏',
  //   repairCost: 2100.00,
  //   repairStatus: 1,
  // },
  // {
  //   workOrderNumber: 'WG-2025110310',
  //   reporter: '吴敏',
  //   department: 'ICU病房',
  //   phone: '130****8901',
  //   deviceName: '呼吸机',
  //   faultDescription: '氧浓度异常',
  //   repairCost: 1250.00,
  //   repairStatus: 0,
  // },
  // {
  //   workOrderNumber: 'WG-2025110311',
  //   reporter: '郑涛',
  //   department: '急诊科',
  //   phone: '139****2345',
  //   deviceName: '心电图机',
  //   faultDescription: '导联接触不良',
  //   repairCost: 380.00,
  //   repairStatus: 1,
  // },
  // {
  //   workOrderNumber: 'WG-2025110312',
  //   reporter: '孙丽',
  //   department: '检验科',
  //   phone: '138****6789',
  //   deviceName: '生化分析仪',
  //   faultDescription: '试剂泵故障',
  //   repairCost: 1950.00,
  //   repairStatus: 0,
  // },
]

function createRepairCategoryColumns(): DataTableColumns<RepairCategory> {
  return [
    { title: '报修类别编码', key: 'categoryCode' },
    { title: '报修类别名称', key: 'categoryName' },
    { title: '维修科室', key: 'maintenanceDepartment' },
    { title: '标准处理时限', key: 'standardProcessingTime' },
    { title: '类别状态', key: 'status' },
    { title: '未处理数', key: 'pendingCount' },
    {
      title: '优先级等级',
      key: 'priorityLevel',
      render(row) {
        return h(NButton, {
          ghost: true,
          round: true,
          size: 'tiny',
          type: row.priorityLevel === 1 ? 'error' : 'warning',
        }, { default: () => row.priorityLevel === 1 ? '紧急处理' : '待处理' })
      },
    },
  ]
}

function createWorkOrderColumns(): DataTableColumns<WorkOrder> {
  return [
    { title: '工单号', key: 'workOrderNumber' },
    { title: '报修人', key: 'reporter' },
    { title: '报修科室', key: 'department' },
    { title: '报修电话', key: 'phone' },
    { title: '设备名称', key: 'deviceName' },
    { title: '故障描述', key: 'faultDescription' },
    { title: '维修费用', key: 'repairCost' },
    {
      title: '维修完成情况',
      key: 'repairStatus',
      render(row) {
        return h(NButton, {
          ghost: true,
          round: true,
          size: 'tiny',
          type: row.repairStatus === 0 ? 'info' : 'warning',
        }, { default: () => row.repairStatus === 0 ? '暂未处理' : '正在修复中' })
      },
    },
  ]
}
const repairCategoryColumns = createRepairCategoryColumns()
const workOrderColumns = createWorkOrderColumns()

onMounted(() => {
  initLineChart()
})

function handleDashboardIconClick() {
  window.open('https://iot.ipalmap.com/logistics-maintenance/front/manage/main/index.html')
}
</script>

<template>
  <TheDashboardTitle
    title="后勤运维管理模块"
    @icon-click="handleDashboardIconClick"
  />
  <div flex="~ col" p="x-30px b-30px" gap-30px h-screen>
    <div shrink-0 h-105px />
    <div grid="~ rows-1 cols-4" gap-30px>
      <TheStatsCard
        v-for="statItem in statsList"
        :key="statItem.title"
        :title="statItem.title"
        :value="statItem.value"
        :icon="statItem.icon"
      />
    </div>
    <div
      flex-1 gap-4
      grid="~ rows-9 cols-4"
      h-full
    >
      <div col-span-2 row-span-4>
        <TheMainBoard title="报修分类管理">
          <NDataTable
            :columns="repairCategoryColumns"
            :data="repairCategoryData"
            :pagination="pagination"
            :bordered="false"
            striped mt-15px
          />
        </TheMainBoard>
      </div>
      <div col-span-2 row-span-4>
        <TheMainBoard title="工单实时监控">
          <NDataTable
            :columns="workOrderColumns"
            :data="workOrderData"
            :pagination="pagination"
            :bordered="false"
            striped mt-15px
          />
        </TheMainBoard>
      </div>
      <div col-span-1 row-span-5>
        <TheMainBoard title="服务结果回访">
          <div h-full w-full flex="~ col">
            <TheSubBoard title="昨日概括">
              <div
                grid="~ rows-1 cols-2" gap-10
              >
                <ThePercentageRing :value="92" title="已回访" type="blue" />
                <ThePercentageRing :value="8" title="未回访" type="orange" />
              </div>
            </TheSubBoard>
            <TheSubBoard title="近一周" flex-1>
              <div ref="lineChartRef" h-full w-full />
            </TheSubBoard>
          </div>
        </TheMainBoard>
      </div>
      <div col-span-3 row-span-5>
        <TheMainBoard title="报修派单管理">
          <div grid="~ rows-4 cols-3" gap="10px" mt-15px>
            <TheWorkOrderItem
              v-for="(item, index) in workOrderData"
              :key="index"
              :top-left="`工单号：${item.workOrderNumber}`"
              :top-right="`设备名称：${item.deviceName}`"
              :bottom-left="`故障描述：${item.faultDescription}`"
              :bottom-right="`受理时间：2025-11-03 ${['08:30:00', '09:15:00', '10:20:00', '11:05:00', '12:30:00', '13:45:00', '14:20:00', '15:10:00', '16:05:00', '17:20:00', '18:15:00', '19:30:00'][index]}`"
            >
              <template #headerExtra>
                <div
                  p="x-10px y-3px"
                  text-10px
                  rounded-sm
                  :class="index % 2 === 0 ? 'bg-hex-ff6b6b' : 'bg-hex-f1ab3e'"
                  shrink-0
                >
                  {{ index % 2 === 0 ? '紧急处理' : '待处理' }}
                </div>
              </template>
            </TheWorkOrderItem>
          </div>
        </TheMainBoard>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

<route lang="yaml">
meta:
  layout: 'default'
  menu:
    title: '后勤运维管理模块'
</route>
