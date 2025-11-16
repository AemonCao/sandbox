<script setup lang="ts">
import type { InfoPanelData } from '../composables/useInfoPanel'

interface Props {
  infoPanelData: InfoPanelData
}
defineProps<Props>()
</script>

<template>
  <div class="info-panel">
    <h3 class="section-title">
      选中对象信息
    </h3>
    <NCard
      size="small"
      bordered
    >
      <!-- 多选设备信息 -->
      <div v-if="infoPanelData.type === 'multi-selection'">
        <h3 class="multi-selection-title">
          已选中 {{ infoPanelData.totalCount }} 个对象
        </h3>

        <div v-if="infoPanelData.beacons?.length > 0" class="object-group">
          <h4 class="object-title beacon">
            信标 ({{ infoPanelData.beacons.length }}个)
          </h4>
          <ul class="object-list">
            <li v-for="beacon in infoPanelData.beacons" :key="`beacon-${beacon.id}`" class="object-item">
              B{{ beacon.id }}: ({{ beacon.x }}m, {{ beacon.y }}m)
            </li>
          </ul>
        </div>

        <div v-if="infoPanelData.clients?.length > 0" class="object-group">
          <h4 class="object-title client">
            客户端 ({{ infoPanelData.clients.length }}个)
          </h4>
          <ul class="object-list">
            <li v-for="client in infoPanelData.clients" :key="`client-${client.id}`" class="object-item">
              C{{ client.id }}: ({{ client.x }}m, {{ client.y }}m)
            </li>
          </ul>
        </div>

        <p class="selection-hint">
          按Delete键可删除所有选中对象，按ESC键清除选择。
        </p>
      </div>

      <!-- 操作说明 -->
      <div v-else-if="infoPanelData.type === 'instructions'">
        <p class="instruction-title">
          操作说明：
        </p>
        <ul class="instruction-list">
          <li>点击设备进行选择</li>
          <li>按住Ctrl/Cmd键点击可多选设备</li>
          <li>在空白区域拖拽可框选多个设备</li>
          <li>选中设备后可拖拽移动</li>
          <li>按Delete键删除选中设备</li>
          <li>按ESC键清除选择</li>
          <li>双击设备可快速删除</li>
        </ul>
        <p class="instruction-hint">
          在画布上点击一个信标或客户端以查看详情。
        </p>
      </div>

      <!-- 信标详情 -->
      <div v-else-if="infoPanelData.type === 'beacon'">
        <h3 class="beacon-title">
          信标 B{{ infoPanelData.id }}
        </h3>
        <ul class="detail-list">
          <li class="detail-item">
            <span class="detail-label">位置 (px):</span>
            <span class="detail-value">({{ infoPanelData.x }}, {{ infoPanelData.y }})</span>
          </li>
          <li class="detail-item">
            <span class="detail-label">位置 (m):</span>
            <span class="detail-value">({{ infoPanelData.xM }}, {{ infoPanelData.yM }})</span>
          </li>
          <li class="detail-item">
            <span class="detail-label">高度 (m):</span>
            <span class="detail-value">{{ infoPanelData.z }}</span>
          </li>
          <li class="detail-item">
            <span class="detail-label">TxPower (dBm):</span>
            <span class="detail-value">{{ infoPanelData.txPower }} (1米处RSSI)</span>
          </li>
        </ul>
      </div>

      <!-- 客户端详情 -->
      <div v-else-if="infoPanelData.type === 'client'">
        <h3 class="client-title">
          客户端 C{{ infoPanelData.id }}
        </h3>
        <ul class="detail-list">
          <li class="detail-item">
            <span class="detail-label">位置 (px):</span>
            <span class="detail-value">({{ infoPanelData.x }}, {{ infoPanelData.y }})</span>
          </li>
          <li class="detail-item">
            <span class="detail-label">位置 (m):</span>
            <span class="detail-value">({{ infoPanelData.xM }}, {{ infoPanelData.yM }})</span>
          </li>
          <li class="detail-item">
            <span class="detail-label">高度 (m):</span>
            <span class="detail-value">{{ infoPanelData.z }}</span>
          </li>
        </ul>
        <h4 class="rssi-title">
          接收到的信号强度:
        </h4>
        <ul class="rssi-list">
          <li
            v-for="data in infoPanelData.rssiData"
            :key="`rssi-${data.beaconId}`"
            class="rssi-item"
            :class="{ audible: data.isAudible, inaudible: !data.isAudible }"
          >
            来自 B{{ data.beaconId }}: {{ data.rssi }} dBm
          </li>
          <li v-if="infoPanelData.rssiData?.length === 0" class="no-rssi">
            无可用信标
          </li>
        </ul>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.info-panel {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 12px;
}

.dark .section-title {
  color: #60a5fa;
}

/* 多选样式 */
.multi-selection-title {
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 12px;
}

.dark .multi-selection-title {
  color: #3b82f6;
}

.object-group {
  margin-top: 12px;
}

.object-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.object-title.beacon {
  color: #2563eb;
}

.dark .object-title.beacon {
  color: #3b82f6;
}

.object-title.client {
  color: #16a34a;
}

.dark .object-title.client {
  color: #22c55e;
}

.object-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.object-item {
  font-size: 14px;
  padding: 2px 0;
}

.selection-hint {
  color: #6b7280;
  font-size: 14px;
  margin-top: 12px;
}

.dark .selection-hint {
  color: #9ca3af;
}

/* 操作说明样式 */
.instruction-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.instruction-list {
  list-style: disc;
  padding-left: 20px;
  margin: 8px 0;
}

.instruction-list li {
  font-size: 14px;
  padding: 2px 0;
}

.instruction-hint {
  color: #6b7280;
  font-size: 14px;
  margin-top: 12px;
}

.dark .instruction-hint {
  color: #9ca3af;
}

/* 详情样式 */
.beacon-title {
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 12px;
}

.dark .beacon-title {
  color: #3b82f6;
}

.client-title {
  color: #16a34a;
  font-weight: 500;
  margin-bottom: 12px;
}

.dark .client-title {
  color: #22c55e;
}

.detail-list {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}

.detail-item {
  font-size: 14px;
  padding: 4px 0;
  display: flex;
  justify-content: space-between;
}

.detail-label {
  font-weight: 500;
  color: #374151;
}

.dark .detail-label {
  color: #d1d5db;
}

.detail-value {
  color: #6b7280;
}

.dark .detail-value {
  color: #9ca3af;
}

/* RSSI样式 */
.rssi-title {
  font-size: 14px;
  font-weight: 500;
  margin: 16px 0 8px 0;
}

.rssi-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rssi-item {
  font-size: 14px;
  padding: 2px 0;
  font-weight: 500;
}

.rssi-item.audible {
  color: #059669;
}

.dark .rssi-item.audible {
  color: #10b981;
}

.rssi-item.inaudible {
  color: #dc2626;
}

.dark .rssi-item.inaudible {
  color: #ef4444;
}

.no-rssi {
  color: #6b7280;
  font-size: 14px;
}

.dark .no-rssi {
  color: #9ca3af;
}

/* Naive UI 组件间距调整 */
:deep(.NCard .NCard__content) {
  padding: 16px;
}
</style>
