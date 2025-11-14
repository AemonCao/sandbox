<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { isDark } from '~/composables'

interface Beacon {
  id: number
  type: 'beacon'
  x: number
  y: number
  z: number
  txPower: number
}

interface Client {
  id: number
  type: 'client'
  x: number
  y: number
  z: number
}

type SelectedObject = Beacon | Client | null

// 响应式状态
const canvasRef = ref<HTMLCanvasElement>()
const canvasContainerRef = ref<HTMLElement>()
const beacons = ref<Beacon[]>([])
const clients = ref<Client[]>([])
const selectedObject = ref<SelectedObject>(null)
const isDragging = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const nextBeaconId = ref(1)
const nextClientId = ref(1)

// 监听主题变化，重新绘制Canvas
watch(isDark, () => {
  nextTick(() => draw())
})

// 配置参数
const scale = ref(50)
const beaconHeight = ref(3)
const beaconN = ref(2.5)
const clientRssiThreshold = ref(-85)
const splitSize = ref(0.75) // 画布占比 (0-1)

// 常量
const BEACON_DEFAULTS = {
  txPower: -59,
  radius: 8,
  color: 'rgba(26, 115, 232, 0.8)',
  selectedColor: '#1a73e8',
}

const CLIENT_DEFAULTS = {
  z: 0.8,
  size: 12,
  color: 'rgba(21, 128, 61, 0.8)',
  selectedColor: '#15803d',
}

// 计算属性
const infoPanelContent = computed(() => {
  if (!selectedObject.value) {
    return '<p>在画布上点击一个信标或客户端以查看详情。双击或选中后按Delete键可删除。</p>'
  }

  if (selectedObject.value.type === 'beacon') {
    const b = selectedObject.value as Beacon
    return `
      <h3>信标 B${b.id}</h3>
      <ul>
        <li>位置 (px): (${b.x.toFixed(1)}, ${b.y.toFixed(1)})</li>
        <li>位置 (m): (${(b.x / scale.value).toFixed(2)}, ${(b.y / scale.value).toFixed(2)})</li>
        <li>高度 (m): ${b.z}</li>
        <li>TxPower (dBm): ${b.txPower} (1米处RSSI)</li>
      </ul>
    `
  }
  else {
    const c = selectedObject.value as Client
    let rssiList = ''

    beacons.value.forEach((b) => {
      const rssi = calculateReceivedRSSI(b, c)
      const color = rssi >= clientRssiThreshold.value ? 'green' : 'red'
      rssiList += `<li>来自 B${b.id}: <strong style="color:${color}">${rssi} dBm</strong></li>`
    })
    if (beacons.value.length === 0) {
      rssiList = '<li>无可用信标</li>'
    }

    return `
      <h3>客户端 C${c.id}</h3>
      <ul>
        <li>位置 (px): (${c.x.toFixed(1)}, ${c.y.toFixed(1)})</li>
        <li>位置 (m): (${(c.x / scale.value).toFixed(2)}, ${(c.y / scale.value).toFixed(2)})</li>
        <li>高度 (m): ${c.z}</li>
      </ul>
      <h4>接收到的信号强度:</h4>
      <ul>${rssiList}</ul>
    `
  }
})

const formulaPanelContent = computed(() => {
  if (!selectedObject.value || selectedObject.value.type !== 'client') {
    return '<p>点击一个客户端以查看计算过程。</p>'
  }

  const client = selectedObject.value as Client
  const audibleBeacons = beacons.value.filter(b => calculateReceivedRSSI(b, client) >= clientRssiThreshold.value)

  if (audibleBeacons.length < 3) {
    return `<p>至少需要接收到3个信标的信号才能进行三角定位。当前接收到 ${audibleBeacons.length} 个。</p>`
  }

  let html = `<h3>C${client.id} 的三角定位计算</h3>`
  html += `<p><strong>第1步:</strong> 根据RSSI计算与每个信标的2D平面距离 (d)</p>`

  const beaconData = audibleBeacons.slice(0, 3).map((b) => {
    const receivedRssi = calculateReceivedRSSI(b, client)
    const distance3D = calculate3DDistanceFromRSSI(b, receivedRssi)
    const heightDiff = b.z - client.z
    const distance2D = calculate2DDistance(distance3D, heightDiff)

    html += `
      <p><strong>对于信标 B${b.id}:</strong></p>
      <code>
RSSI = ${receivedRssi} dBm
TxPower = ${b.txPower} dBm, n = ${beaconN.value}
3D距离 = 10^(${b.txPower} - (${receivedRssi})) / (10 * ${beaconN.value}))
       = ${distance3D.toFixed(3)} 米

平面距离 d${b.id} = sqrt( (3D距离)² - (高度差)² )
            = sqrt( ${distance3D.toFixed(3)}² - (${b.z}-${client.z})² )
            = <strong>${distance2D.toFixed(3)} 米</strong>
      </code>`

    return {
      x: (b.x / scale.value).toFixed(3),
      y: (b.y / scale.value).toFixed(3),
      d: distance2D.toFixed(3),
    }
  })

  html += `<p><strong>第2步:</strong> 建立方程组求解客户端位置 (x, y)</p>`
  html += `<code>
(x - x₁)² + (y - y₁)² = d₁²
(x - x₂)² + (y - y₂)² = d₂²
(x - x₃)² + (y - y₃)² = d₃²

代入数值:
(x - ${beaconData[0].x})² + (y - ${beaconData[0].y})² = ${beaconData[0].d}²
(x - ${beaconData[1].x})² + (y - ${beaconData[1].y})² = ${beaconData[1].d}²
(x - ${beaconData[2].x})² + (y - ${beaconData[2].y})² = ${beaconData[2].d}²
      </code>`

  return html
})

// 核心计算函数
function calculateReceivedRSSI(beacon: Beacon, client: Client): number {
  const dx = (beacon.x - client.x) / scale.value
  const dy = (beacon.y - client.y) / scale.value
  const dz = beacon.z - client.z

  const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (distance3D < 0.01)
    return beacon.txPower

  const rssi = beacon.txPower - 10 * beaconN.value * Math.log10(distance3D)
  return Number.parseFloat(rssi.toFixed(2))
}

function calculate3DDistanceFromRSSI(beacon: Beacon, rssi: number): number {
  const exponent = (beacon.txPower - rssi) / (10 * beaconN.value)
  return 10 ** exponent
}

function calculate2DDistance(distance3D: number, heightDiff: number): number {
  if (distance3D * distance3D < heightDiff * heightDiff) {
    return 0
  }
  return Math.sqrt(distance3D * distance3D - heightDiff * heightDiff)
}

// 绘图函数
function draw(): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawGrid(ctx, canvas)

  clients.value.forEach(c => drawClient(ctx, c))
  beacons.value.forEach(b => drawBeacon(ctx, b))

  if (selectedObject.value) {
    if (selectedObject.value.type === 'beacon') {
      drawBeaconRange(ctx, selectedObject.value as Beacon)
    }
    else if (selectedObject.value.type === 'client') {
      drawClientCircles(ctx, selectedObject.value as Client)
      drawClientConnections(ctx, selectedObject.value as Client)
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  // 根据当前主题选择网格颜色
  ctx.strokeStyle = isDark.value ? '#374151' : '#e0e0e0'
  ctx.lineWidth = 0.5

  for (let x = 0; x < canvas.width; x += scale.value) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }

  for (let y = 0; y < canvas.height; y += scale.value) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
}

function drawBeacon(ctx: CanvasRenderingContext2D, b: Beacon): void {
  const isSelected = selectedObject.value
    && selectedObject.value.id === b.id
    && selectedObject.value.type === 'beacon'

  ctx.beginPath()
  ctx.arc(b.x, b.y, BEACON_DEFAULTS.radius, 0, 2 * Math.PI)
  ctx.fillStyle = BEACON_DEFAULTS.color
  ctx.fill()

  if (isSelected) {
    ctx.lineWidth = 3
    ctx.strokeStyle = BEACON_DEFAULTS.selectedColor
    ctx.stroke()
  }

  ctx.fillStyle = isDark.value ? '#e5e7eb' : '#000'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`B${b.id}`, b.x, b.y + BEACON_DEFAULTS.radius + 12)
}

function drawClient(ctx: CanvasRenderingContext2D, c: Client): void {
  const isSelected = selectedObject.value
    && selectedObject.value.id === c.id
    && selectedObject.value.type === 'client'

  const size = CLIENT_DEFAULTS.size
  ctx.fillStyle = CLIENT_DEFAULTS.color
  ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size)

  if (isSelected) {
    ctx.lineWidth = 3
    ctx.strokeStyle = CLIENT_DEFAULTS.selectedColor
    ctx.strokeRect(c.x - size / 2, c.y - size / 2, size, size)
  }

  ctx.fillStyle = isDark.value ? '#e5e7eb' : '#000'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`C${c.id}`, c.x, c.y + size / 2 + 12)
}

function drawBeaconRange(ctx: CanvasRenderingContext2D, beacon: Beacon): void {
  const distance3D = calculate3DDistanceFromRSSI(beacon, clientRssiThreshold.value)
  const heightDiff = beacon.z - CLIENT_DEFAULTS.z
  const distance2D = calculate2DDistance(distance3D, heightDiff)
  const radiusPx = distance2D * scale.value

  ctx.beginPath()
  ctx.arc(beacon.x, beacon.y, radiusPx, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255, 107, 107, 0.8)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawClientCircles(ctx: CanvasRenderingContext2D, client: Client): void {
  beacons.value.forEach((beacon) => {
    const receivedRssi = calculateReceivedRSSI(beacon, client)
    if (receivedRssi >= clientRssiThreshold.value) {
      const distance3D = calculate3DDistanceFromRSSI(beacon, receivedRssi)
      const heightDiff = beacon.z - client.z
      const distance2D = calculate2DDistance(distance3D, heightDiff)
      const radiusPx = distance2D * scale.value

      ctx.beginPath()
      ctx.arc(beacon.x, beacon.y, radiusPx, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.7)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })
}

function drawClientConnections(ctx: CanvasRenderingContext2D, client: Client): void {
  beacons.value.forEach((beacon) => {
    const receivedRssi = calculateReceivedRSSI(beacon, client)
    if (receivedRssi >= clientRssiThreshold.value) {
      // 计算实际距离
      const dx = (beacon.x - client.x) / scale.value
      const dy = (beacon.y - client.y) / scale.value
      const dz = beacon.z - client.z
      const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // 绘制连线
      ctx.beginPath()
      ctx.moveTo(client.x, client.y)
      ctx.lineTo(beacon.x, beacon.y)
      ctx.strokeStyle = 'rgba(66, 133, 244, 0.8)'
      ctx.lineWidth = 2
      ctx.stroke()

      // 在连线中点显示距离
      const midX = (client.x + beacon.x) / 2
      const midY = (client.y + beacon.y) / 2

      // 绘制背景
      ctx.fillStyle = isDark.value ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)'
      const text = `${distance3D.toFixed(2)}m`
      ctx.font = '12px Arial'
      const textWidth = ctx.measureText(text).width
      ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16)

      // 绘制文字
      ctx.fillStyle = '#4285f4'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, midX, midY)
    }
  })
}

// 交互处理
function getObjectAt(x: number, y: number): SelectedObject {
  for (let i = clients.value.length - 1; i >= 0; i--) {
    const c = clients.value[i]
    const size = CLIENT_DEFAULTS.size
    if (x >= c.x - size / 2 && x <= c.x + size / 2
      && y >= c.y - size / 2 && y <= c.y + size / 2) {
      return c
    }
  }

  for (let i = beacons.value.length - 1; i >= 0; i--) {
    const b = beacons.value[i]
    const dist = Math.sqrt((x - b.x) ** 2 + (y - b.y) ** 2)
    if (dist <= BEACON_DEFAULTS.radius) {
      return b
    }
  }
  return null
}

function handleMouseDown(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  selectedObject.value = getObjectAt(mouseX, mouseY)

  if (selectedObject.value) {
    isDragging.value = true
    canvas.style.cursor = 'grabbing'
    dragOffsetX.value = mouseX - selectedObject.value.x
    dragOffsetY.value = mouseY - selectedObject.value.y
  }
  else {
    isDragging.value = false
  }

  draw()
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging.value || !selectedObject.value)
    return

  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  selectedObject.value.x = mouseX - dragOffsetX.value
  selectedObject.value.y = mouseY - dragOffsetY.value
  draw()
}

function handleMouseUp(): void {
  isDragging.value = false
  const canvas = canvasRef.value
  if (canvas) {
    canvas.style.cursor = 'grab'
  }
}

function handleDoubleClick(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const objectToDelete = getObjectAt(mouseX, mouseY)

  if (objectToDelete) {
    deleteObject(objectToDelete)
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if ((e.target as HTMLElement).tagName === 'INPUT')
    return
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject.value) {
    e.preventDefault()
    deleteObject(selectedObject.value)
  }
}

// 对象管理
function addBeacon(): void {
  const newBeacon: Beacon = {
    id: nextBeaconId.value++,
    type: 'beacon',
    x: 50,
    y: 50,
    z: beaconHeight.value,
    txPower: BEACON_DEFAULTS.txPower,
  }
  beacons.value.push(newBeacon)
  draw()
}

function addClient(): void {
  const newClient: Client = {
    id: nextClientId.value++,
    type: 'client',
    x: 100,
    y: 100,
    z: CLIENT_DEFAULTS.z,
  }
  clients.value.push(newClient)
  draw()
}

function clearAll(): void {
  beacons.value = []
  clients.value = []
  selectedObject.value = null
  nextBeaconId.value = 1
  nextClientId.value = 1
  draw()
}

function deleteObject(obj: SelectedObject): void {
  if (!obj)
    return

  if (obj.type === 'beacon') {
    beacons.value = beacons.value.filter(b => b.id !== obj.id)
  }
  else if (obj.type === 'client') {
    clients.value = clients.value.filter(c => c.id !== obj.id)
  }

  if (selectedObject.value
    && selectedObject.value.id === obj.id
    && selectedObject.value.type === obj.type) {
    selectedObject.value = null
  }

  draw()
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  const container = canvasContainerRef.value
  if (!canvas || !container)
    return

  canvas.width = container.clientWidth - 20
  canvas.height = container.clientHeight - 20
  draw()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    resizeCanvas()

    const canvas = canvasRef.value
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('mouseleave', handleMouseUp)
      canvas.addEventListener('dblclick', handleDoubleClick)
    }

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKeyDown)
    draw()
  })
})
</script>

<template>
  <div bg-gray-100 h-screen overflow-hidden dark:bg-gray-900>
    <NSplit
      direction="horizontal"
      :min="0.5"
      :max="0.9"
      :default-size="splitSize"
      :on-update:size="(size: number) => { splitSize = size; nextTick(() => resizeCanvas()) }"
      class="h-full"
    >
      <!-- 画布容器 -->
      <template #1>
        <div p-2 h-full>
          <div ref="canvasContainerRef" rounded-lg bg-white flex h-full shadow-md items-center justify-center dark:bg-gray-800 dark:shadow-gray-700>
            <canvas
              ref="canvasRef"

              bg-white cursor-grab dark:bg-gray-800
            />
          </div>
        </div>
      </template>

      <!-- 控制面板 -->
      <template #2>
        <div p-5 h-full overflow-y-auto>
          <div mb-4 pb-2 border-b-2 border-gray-200 flex items-center justify-between dark:border-gray-700>
            <h2 text-xl text-blue-600 font-bold dark:text-blue-400>
              控制面板
            </h2>
          </div>

          <!-- 全局设置 -->
          <div mb-5>
            <h3 text-lg text-blue-500 font-semibold mb-3 dark:text-blue-400>
              全局设置
            </h3>

            <div mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>比例尺 (像素/米):</label>
              <NInputNumber
                v-model:value="scale"
                :min="10"
                :step="1"
                placeholder="比例尺"
                @update:value="draw"
              />
            </div>

            <div mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>信标默认高度 (米):</label>
              <NInputNumber
                v-model:value="beaconHeight"
                :min="0"
                :max="20"
                :step="0.1"
                placeholder="信标高度"
                @update:value="draw"
              />
            </div>

            <div mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>RSSI 衰减速率 (n):</label>
              <NInputNumber
                v-model:value="beaconN"
                :min="1"
                :max="5"
                :step="0.1"
                placeholder="衰减速率"
                @update:value="draw"
              />
            </div>

            <div mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>客户端 RSSI 接收阈值 (dBm):</label>
              <NInputNumber
                v-model:value="clientRssiThreshold"
                :max="0"
                :min="-100"
                placeholder="RSSI阈值"
                @update:value="draw"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div mb-5>
            <h3 text-lg text-blue-500 font-semibold mb-3 dark:text-blue-400>
              操作
            </h3>
            <NSpace>
              <NButton type="primary" @click="addBeacon">
                添加蓝牙信标
              </NButton>
              <NButton type="primary" @click="addClient">
                添加客户端
              </NButton>
              <NButton type="error" @click="clearAll">
                全部清除
              </NButton>
            </NSpace>
          </div>

          <!-- 选中对象信息 -->
          <div mb-5>
            <h3 text-lg text-blue-500 font-semibold mb-3 dark:text-blue-400>
              选中对象信息
            </h3>
            <NCard
              size="small"
              bordered
            >
              <div v-html="infoPanelContent" />
            </NCard>
          </div>

          <!-- 定位计算公式 -->
          <div>
            <h3 text-lg text-blue-500 font-semibold mb-3 dark:text-blue-400>
              定位计算公式
            </h3>
            <NCard
              size="small"
              bordered
            >
              <div v-html="formulaPanelContent" />
            </NCard>
          </div>
        </div>
      </template>
    </NSplit>
  </div>
</template>

<style scoped>
canvas {
  touch-action: none;
}

/* Naive UI Split 样式调整 */
:deep(.NSplit) {
  height: 100%;
}

:deep(.NSplit-pane) {
  height: 100%;
}

/* 代码块样式 */
:deep(code) {
  display: block;
  background-color: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  margin-top: 5px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.dark :deep(code) {
  background-color: #374151;
  color: #e5e7eb;
}

:deep(h3) {
  color: #1a73e8;
  margin: 10px 0 5px 0;
}

.dark :deep(h3) {
  color: #60a5fa;
}

:deep(h4) {
  color: #1a73e8;
  margin: 8px 0 3px 0;
  font-size: 14px;
}

.dark :deep(h4) {
  color: #60a5fa;
}

:deep(ul) {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

:deep(li) {
  padding: 2px 0;
}

/* Naive UI 组件间距调整 */
:deep(.NInputNumber) {
  width: 100%;
}

:deep(.NCard .NCard__content) {
  padding: 16px;
}
</style>

<route lang="yaml">
meta:
  layout: default
  title: '室内蓝牙定位模拟器 (三角定位)'
</route>
