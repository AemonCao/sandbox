<script setup lang="ts">
import { computed, ref } from 'vue'

// 类型定义
interface Drug {
  drug: string
  quantity: string
  dosage_unit: string
}

interface Device {
  id: number
  bed_number: string
  name: string
  mask_patient_name: string
  sex: number
  age: number
  nursing_level: number
  allergen: string
  avoid_diet: string
  diagnose: string
  doctor_str: string
  nurse_str: string
  cost_type: number
  admission_number: string
  created_at: string
  alarm_records: any[]
  drugs: Drug[]
  battery: number | null
  volume: number | null
  standard_volume: string
  current_volume: number
  device_status: string
  flow_rate: string
  current_speed: number
  drop_speed_coefficient: number
  percent: number
  remaining_time: number | string
  status: number | null
  tagID: string
  stationID: string
  best_type: string
}

// 模拟数据 - 在实际环境中删除
const mockData = ref({ count: 3, result: [{ id: 560, bed_number: '12', name: '', mask_patient_name: '', sex: 0, age: 0, nursing_level: 2, allergen: '', avoid_diet: '', diagnose: '', doctor_str: '', nurse_str: '', cost_type: 0, admission_number: '', created_at: '', alarm_records: [], drugs: [], battery: null, volume: null, standard_volume: '', current_volume: 0, device_status: '', flow_rate: '', current_speed: 0, drop_speed_coefficient: 20, percent: 0, remaining_time: '', status: null, tagID: '', stationID: '', best_type: '' }, { id: 561, bed_number: '22', name: '', mask_patient_name: '', sex: 0, age: 0, nursing_level: 2, allergen: '', avoid_diet: '', diagnose: '', doctor_str: '', nurse_str: '', cost_type: 0, admission_number: '', created_at: '', alarm_records: [], drugs: [], battery: null, volume: null, standard_volume: '', current_volume: 0, device_status: '', flow_rate: '', current_speed: 0, drop_speed_coefficient: 20, percent: 0, remaining_time: '', status: null, tagID: '', stationID: '', best_type: '' }, { id: 559, bed_number: '11', name: '\u5F20\u534E', mask_patient_name: '\u5F20*', sex: 1, age: 18, nursing_level: 1, allergen: '', avoid_diet: '', diagnose: '', doctor_str: '', nurse_str: '', cost_type: 0, admission_number: '', created_at: '2025-11-17', alarm_records: [], drugs: [{ drug: '生理盐水', quantity: '500', dosage_unit: 'ml' }, { drug: '葡萄糖注射液', quantity: '250', dosage_unit: 'ml' }], battery: null, volume: 0, standard_volume: '0', current_volume: 0, device_status: '', flow_rate: '0', current_speed: 0, drop_speed_coefficient: 20, percent: 0, remaining_time: 0, status: null, tagID: 'EC9A0C711FC9', stationID: '', best_type: '' }], standalone: 'v_2', statistics: { bed_total: 3, patient_total: 1, lv_0: 0, lv_1: 1, lv_2: 0, lv_3: 0, in_hospital: 1, leave_hospital: 0, today_operation: 0 }, full_screen: [] })

// 计算属性
const devices = computed(() => mockData.value.result)
const statistics = computed(() => mockData.value.statistics)

// 获取护理等级文本
/**
 * 映射护理等级到文本描述
 *
 * @param {number} level 护理等级 (0-4)
 * @return {string} 护理等级文本描述
 */
function getNursingLevelText(level: number) {
  const levels: Record<number, string> = {
    0: '无',
    1: '特级护理',
    2: '一级护理',
    3: '二级护理',
    4: '三级护理',
  }
  return levels[level] || '未知'
}

// 获取护理等级颜色
/**
 * 映射护理等级到颜色标识
 *
 * @param {number} level 护理等级 (0-4)
 * @return {string} 颜色标识 (gray/red/orange/blue/green)
 */
function getNursingLevelColor(level: number) {
  const colors: Record<number, string> = {
    0: 'gray',
    1: 'red',
    2: 'orange',
    3: 'blue',
    4: 'green',
  }
  return colors[level] || 'gray'
}

// 获取设备状态
/**
 * 确定设备连接状态和输液状态
 *
 * @param {Device} device 设备对象
 * @param {string} device.tagID 设备标签ID
 * @param {number|null} device.status 设备状态码
 * @param {string} device.device_status 设备状态描述
 * @param {number} device.current_speed 当前滴速
 * @return {object} 状态对象
 * @return {string} return.text 状态文本描述
 * @return {string} return.color 状态颜色标识
 */
function getDeviceStatus(device: Device) {
  if (!device.tagID)
    return { text: '未连接', color: 'gray' }

  // 根据JSON文档中的状态判断：status: 2 表示输液中
  if (device.status === 2 || device.device_status === '输液中')
    return { text: '输液中', color: 'green' }

  if (device.status === null || device.current_speed === 0)
    return { text: '已停止', color: 'orange' }

  if (device.device_status === '空闲')
    return { text: '空闲', color: 'blue' }

  return { text: '待机', color: 'blue' }
}

// 格式化输液进度
/**
 * 格式化输液进度百分比
 *
 * @param {number} percent 进度百分比
 * @return {number} 四舍五入后的整数百分比
 */
function formatInfusionProgress(percent: number) {
  return Math.round(percent)
}

// 格式化剩余时间
/**
 * 格式化剩余时间为可读格式
 *
 * @param {number|string} time 剩余时间（秒数或字符串）
 * @return {string} 格式化后的时间字符串
 */
function formatRemainingTime(time: number | string) {
  if (!time || time === 0)
    return '无'
  if (typeof time === 'string')
    return time
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  if (hours > 0)
    return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

// 获取护理等级统计
const nursingLevelStats = computed(() => [
  { level: 0, name: '无', count: statistics.value.lv_0, color: 'gray' },
  { level: 1, name: '特级护理', count: statistics.value.lv_1, color: 'red' },
  { level: 2, name: '一级护理', count: statistics.value.lv_2, color: 'orange' },
  { level: 3, name: '二级护理', count: statistics.value.lv_3, color: 'blue' },
])

// 获取设备状态统计
const deviceStatusStats = computed(() => {
  const stats = {
    total: devices.value.length,
    infusing: 0,
    stopped: 0,
    offline: 0,
    idle: 0,
  }

  devices.value.forEach((device) => {
    const status = getDeviceStatus(device)
    switch (status.text) {
      case '输液中':
        stats.infusing++
        break
      case '已停止':
        stats.stopped++
        break
      case '未连接':
        stats.offline++
        break
      case '空闲':
      case '待机':
        stats.idle++
        break
    }
  })

  return stats
})
</script>

<template>
  <div p="4 md:6" min-h-screen from-slate-50 to-blue-50 bg-gradient-to-br dark:from-slate-900 dark:to-slate-800>
    <!-- 页面标题 -->
    <div mb="6 md:8">
      <h1 text="6 md:8" text-slate-800 font-bold mb-2 dark:text-slate-100>
        智能输液监控系统
      </h1>
      <p text="3.5 md:4" text-slate-600 dark:text-slate-300>
        实时监控病房输液状态，确保患者安全
      </p>
    </div>

    <!-- 统计卡片区域 -->
    <div mb-8 gap-4 grid grid-cols-2 lg:grid-cols-6 md:grid-cols-4>
      <!-- 总床位数 -->
      <div p="4 md:4" border border-slate-200 rounded-xl bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800>
        <div mb-2 flex items-center justify-between>
          <span text="3.5 md:3.5" text-slate-600 dark:text-slate-400>总床位数</span>
          <div i-carbon-bed text="5 md:5" text-blue-500 />
        </div>
        <div text="6 md:6" text-slate-800 font-bold dark:text-slate-100>
          {{ statistics.bed_total }}
        </div>
      </div>

      <!-- 在院患者 -->
      <div p-4 border border-slate-200 rounded-xl bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800>
        <div mb-2 flex items-center justify-between>
          <span text="3.5 md:3.5" text-slate-600 dark:text-slate-400>在院患者</span>
          <div i-carbon-user text="5 md:5" text-green-500 />
        </div>
        <div text="6 md:6" text-slate-800 font-bold dark:text-slate-100>
          {{ statistics.in_hospital }}
        </div>
      </div>

      <!-- 今日出院 -->
      <div p-4 border border-slate-200 rounded-xl bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800>
        <div mb-2 flex items-center justify-between>
          <span text="3.5 md:3.5" text-slate-600 dark:text-slate-400>今日出院</span>
          <div i-carbon-user-multiple text-xl text-orange-500 />
        </div>
        <div text="6 md:6" text-slate-800 font-bold dark:text-slate-100>
          {{ statistics.leave_hospital }}
        </div>
      </div>

      <!-- 今日手术 -->
      <div p-4 border border-slate-200 rounded-xl bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800>
        <div mb-2 flex items-center justify-between>
          <span text="3.5 md:3.5" text-slate-600 dark:text-slate-400>今日手术</span>
          <div i-carbon-activity text-xl text-purple-500 />
        </div>
        <div text="6 md:6" text-slate-800 font-bold dark:text-slate-100>
          {{ statistics.today_operation }}
        </div>
      </div>

      <!-- 正在输液 -->
      <div p-4 border border-slate-200 rounded-xl bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800>
        <div mb-2 flex items-center justify-between>
          <span text="3.5 md:3.5" text-slate-600 dark:text-slate-400>正在输液</span>
          <div i-carbon-drop text-xl text-green-500 />
        </div>
        <div text="6 md:6" text-slate-800 font-bold dark:text-slate-100>
          {{ deviceStatusStats.infusing }}
        </div>
      </div>

      <!-- 设备离线 -->
      <div p-4 border border-slate-200 rounded-xl bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800>
        <div mb-2 flex items-center justify-between>
          <span text="3.5 md:3.5" text-slate-600 dark:text-slate-400>设备离线</span>
          <div i-carbon-wifi-off text-xl text-gray-500 />
        </div>
        <div text="6 md:6" text-slate-800 font-bold dark:text-slate-100>
          {{ deviceStatusStats.offline }}
        </div>
      </div>
    </div>

    <!-- 护理等级分布 -->
    <div mb-8>
      <h3 text-lg text-slate-800 font-semibold mb-3 dark:text-slate-100>
        护理等级分布
      </h3>
      <div gap-3 grid grid-cols-2 md:grid-cols-4>
        <div
          v-for="level in nursingLevelStats"
          :key="level.level"
          p-3 text-center border rounded-lg
          :class="{
            'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20': level.color === 'red',
            'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20': level.color === 'orange',
            'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20': level.color === 'blue',
            'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20': level.color === 'gray',
          }"
        >
          <div
            text-2xl font-bold
            :class="{
              'text-red-600 dark:text-red-400': level.color === 'red',
              'text-orange-600 dark:text-orange-400': level.color === 'orange',
              'text-blue-600 dark:text-blue-400': level.color === 'blue',
              'text-gray-600 dark:text-gray-400': level.color === 'gray',
            }"
          >
            {{ level.count }}
          </div>
          <div text-sm text-slate-600 dark:text-slate-400>
            {{ level.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 床位监控网格 -->
    <div>
      <div mb-4 flex items-center justify-between>
        <h2 text-xl text-slate-800 font-semibold dark:text-slate-100>
          床位实时监控
        </h2>
        <div text-sm text-slate-600 dark:text-slate-400>
          总床位: {{ statistics.bed_total }} | 在院: {{ statistics.in_hospital }}
        </div>
      </div>

      <div gap-4 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2>
        <!-- 床位卡片 -->
        <div
          v-for="device in devices"
          :key="device.id"

          border border-slate-200 rounded-xl bg-white shadow-sm transition-shadow overflow-hidden dark:border-slate-700 dark:bg-slate-800 hover:shadow-md
        >
          <!-- 卡片头部 -->
          <div p-4 border-b border-slate-100 dark:border-slate-700>
            <div mb-2 flex items-center justify-between>
              <div flex gap-3 items-center>
                <div
                  text-white font-bold rounded-lg flex h-10 w-10 items-center justify-center
                  :class="device.tagID ? 'bg-blue-500' : 'bg-gray-400'"
                >
                  {{ device.bed_number }}
                </div>
                <div>
                  <div text-lg text-slate-800 font-semibold dark:text-slate-100>
                    {{ device.bed_number }}床
                  </div>
                  <div text-sm text-slate-600 dark:text-slate-300>
                    {{ device.mask_patient_name || '空床' }}
                  </div>
                </div>
              </div>

              <!-- 设备状态标签 -->
              <div
                text-xs font-medium px-2 py-1 rounded-full
                :class="{
                  'bg-green-100 text-green-700': getDeviceStatus(device).color === 'green',
                  'bg-orange-100 text-orange-700': getDeviceStatus(device).color === 'orange',
                  'bg-blue-100 text-blue-700': getDeviceStatus(device).color === 'blue',
                  'bg-gray-100 text-gray-700': getDeviceStatus(device).color === 'gray',
                }"
              >
                {{ getDeviceStatus(device).text }}
              </div>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div p-4>
            <!-- 患者信息 -->
            <div v-if="device.name" mb-4>
              <div text-sm text-slate-600 mb-2 dark:text-slate-400>
                患者信息
              </div>
              <div text-sm gap-2 grid grid-cols-2>
                <div>
                  <span text-slate-500 dark:text-slate-400>姓名：</span>
                  <span text-slate-700 font-medium dark:text-slate-300>{{ device.mask_patient_name }}</span>
                </div>
                <div>
                  <span text-slate-500 dark:text-slate-400>性别：</span>
                  <span text-slate-700 dark:text-slate-300>{{ device.sex === 1 ? "男" : "女" }}</span>
                </div>
                <div>
                  <span text-slate-500 dark:text-slate-400>年龄：</span>
                  <span text-slate-700 dark:text-slate-300>{{ device.age }}岁</span>
                </div>
                <div>
                  <span text-slate-500 dark:text-slate-400>护理等级：</span>
                  <span
                    font-medium
                    :class="{
                      'text-red-600 dark:text-red-400': getNursingLevelColor(device.nursing_level) === 'red',
                      'text-orange-600 dark:text-orange-400': getNursingLevelColor(device.nursing_level) === 'orange',
                      'text-blue-600 dark:text-blue-400': getNursingLevelColor(device.nursing_level) === 'blue',
                      'text-green-600 dark:text-green-400': getNursingLevelColor(device.nursing_level) === 'green',
                    }"
                  >
                    {{ getNursingLevelText(device.nursing_level) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 输液进度 -->
            <div v-if="device.tagID" mb-4>
              <div text-sm text-slate-600 mb-2 dark:text-slate-400>
                输液进度
              </div>
              <div>
                <div text-sm mb-1 flex justify-between>
                  <span text-slate-600 dark:text-slate-400>完成度</span>
                  <span text-slate-700 font-medium dark:text-slate-300>{{ formatInfusionProgress(device.percent) }}%</span>
                </div>
                <div
                  rounded-full bg-gray-200 h-2 w-full overflow-hidden dark:bg-slate-600
                >
                  <div
                    rounded-full h-full transition-all duration-300 from-blue-500 to-blue-600 bg-gradient-to-r
                    :style="{ width: `${formatInfusionProgress(device.percent)}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- 药物信息 -->
            <div v-if="device.drugs && device.drugs.length > 0" mb-4>
              <div text-sm text-slate-600 mb-2 dark:text-slate-400>
                药物信息
              </div>
              <div space-y-2>
                <div
                  v-for="(drug, index) in device.drugs"
                  :key="index"
                  p-2 border border-slate-200 rounded-lg bg-blue-50 bg-opacity-20 dark:border-slate-600
                >
                  <div text-sm text-blue-800 font-medium dark:text-blue-200>
                    {{ drug.drug }}
                  </div>
                  <div text-xs text-blue-600 dark:text-blue-300>
                    {{ drug.quantity }} {{ drug.dosage_unit }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 输液参数 -->
            <div v-if="device.tagID" text-sm gap-4 grid grid-cols-2>
              <div>
                <div text-slate-600 mb-1 dark:text-slate-400>
                  流速
                </div>
                <div text-slate-800 font-medium dark:text-slate-200>
                  {{ device.flow_rate || '0' }} ml/h
                </div>
              </div>
              <div>
                <div text-slate-600 mb-1 dark:text-slate-400>
                  滴速
                </div>
                <div text-slate-800 font-medium dark:text-slate-200>
                  {{ device.current_speed || '0' }} 滴/分
                </div>
              </div>
              <div>
                <div text-slate-600 mb-1 dark:text-slate-400>
                  剩余时间
                </div>
                <div text-slate-800 font-medium dark:text-slate-200>
                  {{ formatRemainingTime(device.remaining_time) }}
                </div>
              </div>
              <div>
                <div text-slate-600 mb-1 dark:text-slate-400>
                  设备电量
                </div>
                <div text-slate-800 font-medium dark:text-slate-200>
                  {{ device.battery !== null ? `${device.battery}%` : '离线' }}
                </div>
              </div>
            </div>

            <!-- 容量信息 -->
            <div v-if="device.tagID" text-sm gap-2 grid grid-cols-3>
              <div text-center>
                <div text-slate-500 mb-1 dark:text-slate-400>
                  总容量
                </div>
                <div text-slate-700 font-medium dark:text-slate-300>
                  {{ device.volume || '0' }}ml
                </div>
              </div>
              <div text-center>
                <div text-slate-500 mb-1 dark:text-slate-400>
                  已输液
                </div>
                <div text-green-600 font-medium dark:text-green-400>
                  {{ device.current_volume || '0' }}ml
                </div>
              </div>
              <div text-center>
                <div text-slate-500 mb-1 dark:text-slate-400>
                  剩余
                </div>
                <div text-orange-600 font-medium dark:text-orange-400>
                  {{ (device.volume || 0) - device.current_volume || '0' }}ml
                </div>
              </div>
            </div>

            <!-- 设备信息 -->
            <div v-if="device.tagID" mt-4 pt-4 border-t border-slate-100 dark:border-slate-700>
              <div text-xs text-slate-500 dark:text-slate-400>
                <div mb-1 flex gap-2 items-center>
                  <div i-carbon-device-laptop text-slate-400 dark:text-slate-500 />
                  <span>设备ID: {{ device.tagID }}</span>
                </div>
                <div v-if="device.created_at">
                  入院时间: {{ device.created_at }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义样式 */
</style>

<route lang="yaml">
meta:
  layout: default
  title: '智能输液监控'
  description: '医疗输液管理系统，提供实时数据监控和智能预警功能'
</route>
