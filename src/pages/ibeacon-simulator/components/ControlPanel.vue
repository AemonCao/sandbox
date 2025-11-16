<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  scale: number
  beaconHeight: number
  clientHeight: number
  beaconN: number
  clientRssiThreshold: number
  showCoverageArea: boolean
  coverageStep: number
  beaconsCount: number
  clientsCount: number
  hasSelectedObjects: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:scale': [value: number]
  'update:beacon-height': [value: number]
  'update:client-height': [value: number]
  'update:beacon-n': [value: number]
  'update:client-rssi-threshold': [value: number]
  'update:show-coverage-area': [value: boolean]
  'update:coverage-step': [value: number]
  'addBeacon': []
  'addClient': []
  'clearAll': []
  'clearSelection': []
  'deleteSelected': []
  'updateAllBeaconsHeight': []
  'updateAllClientsHeight': []
  'exportScene': []
  'importScene': []
  'loadPreset': [type: string]
}>()

// 计算属性
const canUpdateBeaconsHeight = computed(() => props.beaconsCount > 0)
const canUpdateClientsHeight = computed(() => props.clientsCount > 0)
</script>

<template>
  <div class="control-panel">
    <!-- 全局设置 -->
    <div class="section">
      <h3 class="section-title">
        全局设置
      </h3>

      <div class="form-group">
        <label class="form-label">比例尺 (像素/米):</label>
        <NInputNumber
          :model-value="scale"
          :min="10"
          :step="1"
          placeholder="比例尺"
          @update:model-value="emit('update:scale', $event)"
        />
      </div>

      <div class="form-group">
        <label class="form-label">信标默认高度 (米):</label>
        <div class="input-with-button">
          <NInputNumber
            :model-value="beaconHeight"
            :min="0"
            :max="20"
            :step="0.1"
            placeholder="信标高度"
            @update:model-value="emit('update:beacon-height', $event)"
          />
          <NButton
            size="small"
            type="primary"
            :disabled="!canUpdateBeaconsHeight"
            @click="emit('updateAllBeaconsHeight')"
          >
            应用到所有信标
          </NButton>
        </div>
        <div class="form-hint">
          修改只影响新增信标，点击"应用到所有信标"更新现有信标
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">客户端默认高度 (米):</label>
        <div class="input-with-button">
          <NInputNumber
            :model-value="clientHeight"
            :min="0"
            :max="20"
            :step="0.1"
            placeholder="客户端高度"
            @update:model-value="emit('update:client-height', $event)"
          />
          <NButton
            size="small"
            type="primary"
            :disabled="!canUpdateClientsHeight"
            @click="emit('updateAllClientsHeight')"
          >
            应用到所有客户端
          </NButton>
        </div>
        <div class="form-hint">
          修改只影响新增客户端，点击"应用到所有客户端"更新现有客户端
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">RSSI 衰减速率 (n):</label>
        <NInputNumber
          :model-value="beaconN"
          :min="1"
          :max="5"
          :step="0.1"
          placeholder="衰减速率"
          @update:model-value="emit('update:beacon-n', $event)"
        />
      </div>

      <div class="form-group">
        <label class="form-label">客户端 RSSI 接收阈值 (dBm):</label>
        <NInputNumber
          :model-value="clientRssiThreshold"
          :max="0"
          :min="-100"
          placeholder="RSSI阈值"
          @update:model-value="emit('update:client-rssi-threshold', $event)"
        />
      </div>

      <div class="form-group">
        <label class="form-label">显示定位覆盖范围:</label>
        <NSwitch
          :model-value="showCoverageArea"
          @update:model-value="emit('update:show-coverage-area', $event)"
        >
          <template #checked>
            显示
          </template>
          <template #unchecked>
            隐藏
          </template>
        </NSwitch>
      </div>

      <div v-if="showCoverageArea" class="form-group">
        <label class="form-label">采样步长 (像素):</label>
        <NInputNumber
          :model-value="coverageStep"
          :min="5"
          :max="50"
          :step="1"
          placeholder="采样步长"
          @update:model-value="emit('update:coverage-step', $event)"
        />
        <div class="form-hint">
          较小的值提供更高精度但性能较差，较大的值性能更好但精度较低
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="section">
      <h3 class="section-title">
        操作
      </h3>
      <NSpace vertical>
        <NSpace>
          <NButton type="primary" @click="emit('addBeacon')">
            添加蓝牙信标
          </NButton>
          <NButton type="primary" @click="emit('addClient')">
            添加客户端
          </NButton>
          <NButton type="error" @click="emit('clearAll')">
            全部清除
          </NButton>
        </NSpace>
        <NSpace>
          <NButton
            type="warning"
            :disabled="!hasSelectedObjects"
            @click="emit('clearSelection')"
          >
            清除选择
          </NButton>
          <NButton
            type="error"
            :disabled="!hasSelectedObjects"
            @click="emit('deleteSelected')"
          >
            删除选中
          </NButton>
        </NSpace>
        <NSpace>
          <NButton type="info" @click="emit('exportScene')">
            导出场景
          </NButton>
          <NButton type="warning" @click="emit('importScene')">
            导入场景
          </NButton>
        </NSpace>

        <!-- 预设场景 -->
        <div>
          <label class="form-label">预设场景模板:</label>
          <NSpace>
            <NButton size="small" @click="emit('loadPreset', 'hospital')">
              医院环境
            </NButton>
            <NButton size="small" @click="emit('loadPreset', 'office')">
              办公室
            </NButton>
            <NButton size="small" @click="emit('loadPreset', 'warehouse')">
              仓库
            </NButton>
          </NSpace>
        </div>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.section:last-child {
  border-bottom: none;
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

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.dark .form-label {
  color: #d1d5db;
}

.input-with-button {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.input-with-button .NInputNumber {
  flex: 1;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.dark .form-hint {
  color: #9ca3af;
}

/* Naive UI 组件间距调整 */
:deep(.NInputNumber) {
  width: 100%;
}

:deep(.NSpace) {
  width: 100%;
}

:deep(.NSpace-item) {
  display: flex;
}
</style>
