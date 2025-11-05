<script setup lang="ts">
import Equipment from '~/components/Equipment.vue'
import TheDashboardTitle from '~/components/TheDashboardTitle.vue'
import TheMainBoard from '~/components/TheMainBoard.vue'
import TheWorkOrderCard from './components/TheWorkOrderCard.vue'

interface WorkOrder {
  workOrderNumber: string
  repairDepartment: string
  repairTime: string
  personInCharge: string
  status: string
}

const workOrderList: Ref<WorkOrder[]> = ref([
  {
    workOrderNumber: 'YW-2025110301',
    repairDepartment: '手术室',
    repairTime: '08:30:00',
    personInCharge: '张明',
    status: '未执行',
  },
  {
    workOrderNumber: 'YW-2025110302',
    repairDepartment: 'ICU病房',
    repairTime: '09:15:00',
    personInCharge: '李华',
    status: '执行中',
  },
  {
    workOrderNumber: 'YW-2025110303',
    repairDepartment: '急诊科',
    repairTime: '10:20:00',
    personInCharge: '王芳',
    status: '已完成',
  },
  {
    workOrderNumber: 'YW-2025110304',
    repairDepartment: '检验科',
    repairTime: '11:05:00',
    personInCharge: '赵伟',
    status: '未执行',
  },
  {
    workOrderNumber: 'YW-2025110305',
    repairDepartment: '放射科',
    repairTime: '13:30:00',
    personInCharge: '刘洋',
    status: '执行中',
  },
  {
    workOrderNumber: 'YW-2025110306',
    repairDepartment: '药房',
    repairTime: '14:45:00',
    personInCharge: '陈明',
    status: '未执行',
  },
  {
    workOrderNumber: 'YW-2025110307',
    repairDepartment: '住院部',
    repairTime: '15:20:00',
    personInCharge: '张丽',
    status: '已完成',
  },
  {
    workOrderNumber: 'YW-2025110308',
    repairDepartment: '门诊部',
    repairTime: '16:10:00',
    personInCharge: '王刚',
    status: '执行中',
  },
  {
    workOrderNumber: 'YW-2025110309',
    repairDepartment: '手术室',
    repairTime: '08:45:00',
    personInCharge: '周强',
    status: '未执行',
  },
  {
    workOrderNumber: 'YW-2025110310',
    repairDepartment: 'ICU病房',
    repairTime: '10:30:00',
    personInCharge: '吴敏',
    status: '已完成',
  },
  {
    workOrderNumber: 'YW-2025110311',
    repairDepartment: '急诊科',
    repairTime: '11:50:00',
    personInCharge: '郑涛',
    status: '执行中',
  },
  {
    workOrderNumber: 'YW-2025110312',
    repairDepartment: '检验科',
    repairTime: '14:15:00',
    personInCharge: '孙丽',
    status: '未执行',
  },
])

function handleDashboardIconClick() {
}

// 报警数据列表
const alarmList = [
  {
    deviceId: 'MED-2025110301',
    reason: '手术室空调温度异常',
    time: '2025.11.03 08:15:21',
    status: '紧急' as const,
  },
  {
    deviceId: 'MED-2025110302',
    reason: 'ICU病房氧气浓度偏低',
    time: '2025.11.03 09:22:30',
    status: '紧急' as const,
  },
  {
    deviceId: 'MED-2025110303',
    reason: '急诊科监护仪信号中断',
    time: '2025.11.03 10:08:45',
    status: '警告' as const,
  },
  {
    deviceId: 'MED-2025110304',
    reason: '检验科离心机转速异常',
    time: '2025.11.03 11:25:12',
    status: '警告' as const,
  },
  {
    deviceId: 'MED-2025110305',
    reason: '放射科CT设备过热',
    time: '2025.11.03 13:41:33',
    status: '紧急' as const,
  },
  {
    deviceId: 'MED-2025110306',
    reason: '药房冷藏柜温度偏高',
    time: '2025.11.03 14:28:15',
    status: '警告' as const,
  },
  {
    deviceId: 'MED-2025110307',
    reason: '住院部呼叫系统故障',
    time: '2025.11.03 15:35:42',
    status: '警告' as const,
  },
  {
    deviceId: 'MED-2025110308',
    reason: '门诊部打印机缺纸',
    time: '2025.11.03 16:12:27',
    status: '警告' as const,
  },
]

// 工单数据
const equipmentData = [
  { label: '未执行工单数', value: 45, percentage: 37, color: '#17D1FC' },
  { label: '执行中工单数', value: 32, percentage: 27, color: '#F1AB3E' },
  { label: '已完成工单数', value: 28, percentage: 23, color: '#A4B2FB' },
  { label: '未处理报警工单数', value: 15, percentage: 13, color: '#17FA47' },
]

// 工单总数
const equipmentTotal = computed(() => {
  return equipmentData.reduce((total, item) => total + item.value, 0)
})
</script>

<template>
  <TheDashboardTitle
    title="运维智能分析系统"
    @icon-click="handleDashboardIconClick"
  />
  <div h-screen flex="~ col">
    <div shrink-0 h-105px />
    <div
      p-4 flex-1 gap-4
      grid="~ rows-5 cols-4"
      h-full
    >
      <div col-span-1 row-span-2>
        <TheMainBoard title="工单系统监测">
          <Equipment
            :total="equipmentTotal"
            :equipment-list="equipmentData"
          />
        </TheMainBoard>
      </div>
      <div col-span-3 row-span-5>
        <TheMainBoard title="工单流转监控">
          <div grid="~ cols-4 rows-3" mt-15px gap-10px>
            <TheWorkOrderCard
              v-for="(item, index) in workOrderList"
              :key="index"
              :work-order-number="item.workOrderNumber"
              :repair-department="item.repairDepartment"
              :repair-time="item.repairTime"
              :person-in-charge="item.personInCharge"
              :status="item.status"
            />
          </div>
        </TheMainBoard>
      </div>
      <div col-span-1 row-span-3>
        <TheMainBoard title="系统报警管理">
          <AlarmList :list="alarmList" mt-15px />
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
    title: '运维智能分析系统'
</route>
