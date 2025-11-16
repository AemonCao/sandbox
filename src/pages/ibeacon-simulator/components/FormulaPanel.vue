<script setup lang="ts">
import type { FormulaPanelData } from '../composables/useFormulaPanel'

interface Props {
  formulaPanelData: FormulaPanelData
}
defineProps<Props>()
</script>

<template>
  <div class="formula-panel">
    <h3 class="section-title">
      定位计算公式
    </h3>
    <NCard
      size="small"
      bordered
    >
      <!-- 无客户端时的提示 -->
      <div v-if="formulaPanelData.type === 'empty'">
        <p class="empty-message">
          点击一个客户端以查看计算过程。
        </p>
      </div>

      <!-- 信号不足时的提示 -->
      <div v-else-if="formulaPanelData.type === 'insufficient'">
        <p class="insufficient-message">
          至少需要接收到3个信标的信号才能进行三角定位。
          客户端C{{ formulaPanelData.clientId }}当前接收到 {{ formulaPanelData.count }} 个。
        </p>
      </div>

      <!-- 计算过程展示 -->
      <div v-else-if="formulaPanelData.type === 'calculation'">
        <h3 class="calculation-title">
          C{{ formulaPanelData.clientId }} 的三角定位计算
        </h3>

        <p class="step-title">
          第1步: 根据RSSI计算与每个信标的2D平面距离 (d)
        </p>

        <div class="beacon-calculations">
          <div v-for="beacon in formulaPanelData.beaconData" :key="`calc-${beacon.beaconId}`" class="beacon-calculation">
            <p class="beacon-title">
              对于信标 B{{ beacon.beaconId }}:
            </p>
            <pre class="calculation-code">{{ `RSSI = ${beacon.receivedRssi} dBm
TxPower = ${beacon.txPower} dBm, n = ${formulaPanelData.n}
3D距离 = 10^((${beacon.txPower} - (${beacon.receivedRssi})) / (10 * ${formulaPanelData.n}))
        = ${beacon.distance3D} 米

平面距离 d${beacon.beaconId} = sqrt( (3D距离)² - (高度差)² )
        = sqrt( ${beacon.distance3D}² - (${beacon.heightDiff})² )
        = ${beacon.distance2D} 米` }}</pre>
          </div>
        </div>

        <p class="step-title">
          第2步: 建立方程组求解客户端位置 (x, y)
        </p>
        <pre class="calculation-code">{{ `(x - x₁)² + (y - y₁)² = d₁²
(x - x₂)² + (y - y₂)² = d₂²
(x - x₃)² + (y - y₃)² = d₃²

代入数值:
(x - ${formulaPanelData.beaconData[0]?.x})² + (y - ${formulaPanelData.beaconData[0]?.y})² = ${formulaPanelData.beaconData[0]?.distance2D}²
(x - ${formulaPanelData.beaconData[1]?.x})² + (y - ${formulaPanelData.beaconData[1]?.y})² = ${formulaPanelData.beaconData[1]?.distance2D}²
(x - ${formulaPanelData.beaconData[2]?.x})² + (y - ${formulaPanelData.beaconData[2]?.y})² = ${formulaPanelData.beaconData[2]?.distance2D}²` }}</pre>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 12px;
}

.dark .section-title {
  color: #60a5fa;
}

.empty-message,
.insufficient-message {
  color: #6b7280;
  margin: 0;
}

.dark .empty-message,
.dark .insufficient-message {
  color: #9ca3af;
}

.calculation-title {
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 16px;
}

.dark .calculation-title {
  color: #3b82f6;
}

.step-title {
  font-weight: 500;
  margin-bottom: 12px;
}

.beacon-calculations {
  margin-bottom: 20px;
}

.beacon-calculation {
  margin-bottom: 16px;
}

.beacon-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.calculation-code {
  display: block;
  background-color: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #1f2937;
}

.dark .calculation-code {
  background-color: #374151;
  color: #e5e7eb;
}

/* Naive UI 组件间距调整 */
:deep(.NCard .NCard__content) {
  padding: 16px;
}
</style>
