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
const gridCanvasRef = ref<HTMLCanvasElement>()
const canvasContainerRef = ref<HTMLElement>()
const beacons = ref<Beacon[]>([])
const clients = ref<Client[]>([])
const selectedObject = ref<SelectedObject>(null)
const selectedObjects = ref<(Beacon | Client)[]>([])
const isDragging = ref(false)
const isBoxSelecting = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const nextBeaconId = ref(1)
const nextClientId = ref(1)
const animationFrameId = ref<number | null>(null)
const messageInfo = ref({
  content: '',
  type: 'info' as 'info' | 'success' | 'warning' | 'error',
  show: false,
})

// 框选相关状态
const boxSelection = ref({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  isActive: false,
})

// 配置参数
const scale = ref(50)
const beaconHeight = ref(3)
const clientHeight = ref(0.8) // 客户端默认高度（米）
const beaconN = ref(2.5)
const clientRssiThreshold = ref(-85)
const showCoverageArea = ref(false) // 定位范围显示开关
const coverageStep = ref(10) // 定位覆盖范围采样步长（像素）
const splitSize = ref(0.75) // 画布占比 (0-1)

// 场景数据管理
const sceneData = computed(() => ({
  beacons: beacons.value,
  clients: clients.value,
  settings: {
    scale: scale.value,
    beaconHeight: beaconHeight.value,
    clientHeight: clientHeight.value,
    beaconN: beaconN.value,
    clientRssiThreshold: clientRssiThreshold.value,
    showCoverageArea: showCoverageArea.value,
    coverageStep: coverageStep.value,
  },
  metadata: {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    name: 'iBeacon模拟器场景',
  },
}))

// 监听主题变化，重新绘制Canvas
watch(isDark, () => {
  nextTick(() => {
    drawGrid()
    draw()
  })
})

// 常量定义
const BEACON_DEFAULTS = {
  txPower: -59,
  radius: 8,
  color: 'rgba(26, 115, 232, 0.8)',
  selectedColor: '#1a73e8',
}

const CLIENT_DEFAULTS = computed(() => ({
  z: clientHeight.value,
  size: 12,
  color: 'rgba(21, 128, 61, 0.8)',
  selectedColor: '#15803d',
}))

// 覆盖范围缓存 - 只依赖于信标位置和参数，与客户端无关
const coverageAreaCache = ref<{
  canvas: HTMLCanvasElement | null
  beaconsHash: string
  settingsHash: string
}>({
  canvas: null,
  beaconsHash: '',
  settingsHash: '',
})

// 计算信标和设置的哈希值
function calculateBeaconsHash(): string {
  return beacons.value.map(b => `${b.id}-${b.x.toFixed(0)}-${b.y.toFixed(0)}-${b.z}-${b.txPower}`).join('|')
}

function calculateSettingsHash(): string {
  return `${scale.value}-${clientRssiThreshold.value}-${coverageStep.value}-${beaconN.value}`
}

// 绘制定位覆盖范围
function drawCoverageArea(ctx: CanvasRenderingContext2D): void {
  if (beacons.value.length < 3)
    return

  const canvas = canvasRef.value
  if (!canvas)
    return

  const width = canvas.width
  const height = canvas.height
  const step = coverageStep.value // 采样步长（像素）

  // 计算当前信标和设置的哈希值
  const currentBeaconsHash = calculateBeaconsHash()
  const currentSettingsHash = calculateSettingsHash()

  // 检查缓存是否有效
  if (coverageAreaCache.value.canvas
    && coverageAreaCache.value.beaconsHash === currentBeaconsHash
    && coverageAreaCache.value.settingsHash === currentSettingsHash
    && coverageAreaCache.value.canvas.width === width
    && coverageAreaCache.value.canvas.height === height) {
    // 使用缓存的覆盖范围
    ctx.drawImage(coverageAreaCache.value.canvas, 0, 0)
    return
  }

  // 缓存失效，重新计算覆盖范围
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx)
    return

  // 遍历画布上的每个点
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      const testClient: Client = {
        id: -1,
        type: 'client',
        x,
        y,
        z: CLIENT_DEFAULTS.value.z,
      }

      // 计算能接收到的信号数量
      const audibleBeacons = beacons.value.filter(beacon =>
        calculateReceivedRSSI(beacon, testClient) >= clientRssiThreshold.value,
      )

      // 如果能接收到3个以上信标信号，绘制半透明颜色
      if (audibleBeacons.length >= 3) {
        tempCtx.fillStyle = 'rgba(76, 175, 80, 0.3)' // 绿色半透明
        tempCtx.fillRect(x, y, step, step)
      }
    }
  }

  // 更新缓存
  coverageAreaCache.value = {
    canvas: tempCanvas,
    beaconsHash: currentBeaconsHash,
    settingsHash: currentSettingsHash,
  }

  // 将覆盖范围绘制到主canvas
  ctx.drawImage(tempCanvas, 0, 0)
}

// 监听scale变化，重新绘制网格
watch(scale, () => {
  nextTick(() => {
    // 清除覆盖范围缓存
    coverageAreaCache.value.canvas = null
    drawGrid()
    draw()
  })
})

// 监听clientHeight变化，重新绘制Canvas
watch(clientHeight, () => {
  nextTick(() => {
    draw()
  })
})

// 监听影响覆盖范围的参数变化，清除缓存
watch([beaconN, clientRssiThreshold, coverageStep], () => {
  coverageAreaCache.value.canvas = null
})

// 监听信标位置变化，清除覆盖范围缓存
watch(beacons, () => {
  coverageAreaCache.value.canvas = null
}, { deep: true })

// 本地存储自动保存
function saveToLocalStorage(): void {
  try {
    localStorage.setItem('ibeacon-scene', JSON.stringify(sceneData.value))
    localStorage.setItem('ibeacon-scene-timestamp', new Date().toISOString())
  }
  catch (error) {
    console.error('自动保存失败:', error)
  }
}

function loadFromLocalStorage(): void {
  try {
    const savedData = localStorage.getItem('ibeacon-scene')
    if (!savedData)
      return

    const data = JSON.parse(savedData)

    // 检查数据是否过期（7天）
    const timestamp = localStorage.getItem('ibeacon-scene-timestamp')
    if (timestamp) {
      const savedTime = new Date(timestamp)
      const now = new Date()
      const daysDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 7) {
        localStorage.removeItem('ibeacon-scene')
        localStorage.removeItem('ibeacon-scene-timestamp')
        return
      }
    }

    // 加载数据
    beacons.value = data.beacons || []
    clients.value = data.clients || []

    if (data.settings) {
      scale.value = data.settings.scale || 50
      beaconHeight.value = data.settings.beaconHeight || 3
      clientHeight.value = data.settings.clientHeight || 0.8
      beaconN.value = data.settings.beaconN || 2.5
      clientRssiThreshold.value = data.settings.clientRssiThreshold || -85
      showCoverageArea.value = data.settings.showCoverageArea || false
      coverageStep.value = data.settings.coverageStep || 10
    }

    // 更新ID计数器
    nextBeaconId.value = Math.max(...beacons.value.map(b => b.id), 0) + 1
    nextClientId.value = Math.max(...clients.value.map(c => c.id), 0) + 1

    selectedObject.value = null

    nextTick(() => {
      drawGrid()
      draw()
    })
  }
  catch (error) {
    console.error('加载本地存储失败:', error)
  }
}

// 监听数据变化自动保存
watch([beacons, clients, scale, beaconHeight, clientHeight, beaconN, clientRssiThreshold, showCoverageArea, coverageStep], () => {
  saveToLocalStorage()
}, { deep: true })

// 定义数据类型接口
interface MultiSelectionData {
  type: 'multi-selection'
  totalCount: number
  beacons: Array<{ id: number, x: string, y: string }>
  clients: Array<{ id: number, x: string, y: string }>
}

interface InstructionData {
  type: 'instructions'
}

interface BeaconData {
  type: 'beacon'
  id: number
  x: string
  y: string
  xM: string
  yM: string
  z: number
  txPower: number
}

interface ClientData {
  type: 'client'
  id: number
  x: string
  y: string
  xM: string
  yM: string
  z: number
  rssiData: Array<{ beaconId: number, rssi: number, isAudible: boolean }>
}

type InfoPanelData = MultiSelectionData | InstructionData | BeaconData | ClientData

// 公式面板数据类型
interface EmptyFormulaData {
  type: 'empty'
}

interface InsufficientFormulaData {
  type: 'insufficient'
  count: number
  clientId: number
}

interface CalculationFormulaData {
  type: 'calculation'
  clientId: number
  audibleCount: number
  beaconData: Array<{
    beaconId: number
    txPower: number
    receivedRssi: number
    distance3D: string
    heightDiff: number
    distance2D: string
    x: string
    y: string
  }>
  n: number
}

type FormulaPanelData = EmptyFormulaData | InsufficientFormulaData | CalculationFormulaData

// 计算属性 - 返回结构化数据而不是HTML字符串
const infoPanelData = computed((): InfoPanelData => {
  if (selectedObjects.value.length > 1) {
    // 多选设备信息
    const beacons = selectedObjects.value.filter(obj => obj.type === 'beacon') as Beacon[]
    const clients = selectedObjects.value.filter(obj => obj.type === 'client') as Client[]

    return {
      type: 'multi-selection',
      totalCount: selectedObjects.value.length,
      beacons: beacons.map(b => ({
        id: b.id,
        x: (b.x / scale.value).toFixed(2),
        y: (b.y / scale.value).toFixed(2),
      })),
      clients: clients.map(c => ({
        id: c.id,
        x: (c.x / scale.value).toFixed(2),
        y: (c.y / scale.value).toFixed(2),
      })),
    }
  }

  if (!selectedObject.value) {
    return { type: 'instructions' }
  }

  if (selectedObject.value.type === 'beacon') {
    const b = selectedObject.value as Beacon
    return {
      type: 'beacon',
      id: b.id,
      x: b.x.toFixed(1),
      y: b.y.toFixed(1),
      xM: (b.x / scale.value).toFixed(2),
      yM: (b.y / scale.value).toFixed(2),
      z: b.z,
      txPower: b.txPower,
    }
  }
  else {
    const c = selectedObject.value as Client
    return {
      type: 'client',
      id: c.id,
      x: c.x.toFixed(1),
      y: c.y.toFixed(1),
      xM: (c.x / scale.value).toFixed(2),
      yM: (c.y / scale.value).toFixed(2),
      z: c.z,
      rssiData: beacons.value.map((b) => {
        const rssi = calculateReceivedRSSI(b, c)
        return {
          beaconId: b.id,
          rssi,
          isAudible: rssi >= clientRssiThreshold.value,
        }
      }),
    }
  }
})

// 计算属性 - 返回结构化数据
const formulaPanelData = computed((): FormulaPanelData => {
  if (!selectedObject.value || selectedObject.value.type !== 'client') {
    return { type: 'empty' }
  }

  const client = selectedObject.value as Client
  const audibleBeacons = beacons.value.filter(b => calculateReceivedRSSI(b, client) >= clientRssiThreshold.value)

  if (audibleBeacons.length < 3) {
    return {
      type: 'insufficient',
      count: audibleBeacons.length,
      clientId: client.id,
    }
  }

  const beaconData = audibleBeacons.slice(0, 3).map((b) => {
    const receivedRssi = calculateReceivedRSSI(b, client)
    const distance3D = calculate3DDistanceFromRSSI(b, receivedRssi)
    const heightDiff = b.z - client.z
    const distance2D = calculate2DDistance(distance3D, heightDiff)

    return {
      beaconId: b.id,
      txPower: b.txPower,
      receivedRssi,
      distance3D: distance3D.toFixed(3),
      heightDiff,
      distance2D: distance2D.toFixed(3),
      x: (b.x / scale.value).toFixed(3),
      y: (b.y / scale.value).toFixed(3),
    }
  })

  return {
    type: 'calculation',
    clientId: client.id,
    audibleCount: audibleBeacons.length,
    beaconData,
    n: beaconN.value,
  }
})

// 记忆化优化 - 缓存RSSI计算结果
const cachedRSSICalculation = (() => {
  const cache = new Map<string, number>()

  return (beacon: Beacon, client: Client): number => {
    // 缓存键包含位置信息，确保移动时重新计算
    const key = `${beacon.id}-${client.id}-${beacon.txPower}-${beacon.z}-${client.z}-${scale.value}-${beaconN.value}-${beacon.x.toFixed(0)}-${beacon.y.toFixed(0)}-${client.x.toFixed(0)}-${client.y.toFixed(0)}`

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = performRSSICalculation(beacon, client)
    cache.set(key, result)

    // 限制缓存大小，避免内存泄漏
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value
      if (firstKey) {
        cache.delete(firstKey)
      }
    }

    return result
  }
})()

// 核心计算函数
function calculateReceivedRSSI(beacon: Beacon, client: Client): number {
  return cachedRSSICalculation(beacon, client)
}

function performRSSICalculation(beacon: Beacon, client: Client): number {
  try {
    // 参数验证
    if (!beacon || !client || scale.value <= 0 || beaconN.value <= 0) {
      return -100 // 返回最小RSSI值
    }

    const dx = (beacon.x - client.x) / scale.value
    const dy = (beacon.y - client.y) / scale.value
    const dz = beacon.z - client.z

    const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // 检查距离是否有效
    if (Number.isNaN(distance3D) || !Number.isFinite(distance3D)) {
      return -100
    }

    if (distance3D < 0.01)
      return beacon.txPower

    const rssi = beacon.txPower - 10 * beaconN.value * Math.log10(distance3D)

    // 检查计算结果是否有效
    if (Number.isNaN(rssi) || !Number.isFinite(rssi)) {
      return -100
    }

    return Number.parseFloat(rssi.toFixed(2))
  }
  catch (error) {
    console.error('RSSI计算错误:', error)
    showError('RSSI计算出现错误，请检查参数设置')
    return -100
  }
}

function calculate3DDistanceFromRSSI(beacon: Beacon, rssi: number): number {
  try {
    // 参数验证
    if (!beacon || Number.isNaN(rssi) || !Number.isFinite(rssi) || beaconN.value <= 0) {
      return 0
    }

    const exponent = (beacon.txPower - rssi) / (10 * beaconN.value)

    // 检查指数是否有效
    if (Number.isNaN(exponent) || !Number.isFinite(exponent)) {
      return 0
    }

    const distance = 10 ** exponent

    // 检查距离是否合理
    if (Number.isNaN(distance) || !Number.isFinite(distance) || distance < 0 || distance > 1000) {
      return 0
    }

    return Number.parseFloat(distance.toFixed(3))
  }
  catch (error) {
    console.error('3D距离计算错误:', error)
    showError('3D距离计算出现错误，请检查RSSI值和衰减参数')
    return 0
  }
}

function calculate2DDistance(distance3D: number, heightDiff: number): number {
  try {
    // 参数验证
    if (Number.isNaN(distance3D) || !Number.isFinite(distance3D)
      || Number.isNaN(heightDiff) || !Number.isFinite(heightDiff)
      || distance3D < 0) {
      return 0
    }

    const squaredDiff = heightDiff * heightDiff
    const squaredDistance = distance3D * distance3D

    if (squaredDistance < squaredDiff) {
      return 0
    }

    const distance2D = Math.sqrt(squaredDistance - squaredDiff)

    // 检查结果有效性
    if (Number.isNaN(distance2D) || !Number.isFinite(distance2D) || distance2D < 0) {
      return 0
    }

    return Number.parseFloat(distance2D.toFixed(3))
  }
  catch (error) {
    console.error('2D距离计算错误:', error)
    showError('2D距离计算出现错误，请检查高度差和距离参数')
    return 0
  }
}

// 消息提示函数
function showMessage(content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  messageInfo.value = {
    content,
    type,
    show: true,
  }
  setTimeout(() => {
    messageInfo.value.show = false
  }, 3000)
}

// 保持向后兼容的函数
function showError(message: string): void {
  showMessage(message, 'error')
}

function showSuccess(message: string): void {
  showMessage(message, 'success')
}

// 绘图函数
function draw(): void {
  const canvas = canvasRef.value
  const gridCanvas = gridCanvasRef.value
  if (!canvas || !gridCanvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // 清除动态层
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制定位覆盖范围（如果开启）
  if (showCoverageArea.value) {
    drawCoverageArea(ctx)
  }

  // 绘制动态元素（不包括网格）
  clients.value.forEach(c => drawClient(ctx, c))
  beacons.value.forEach(b => drawBeacon(ctx, b))

  // 绘制选中对象的特效
  if (selectedObject.value && selectedObjects.value.length <= 1) {
    // 单选时的特效
    if (selectedObject.value.type === 'beacon') {
      drawBeaconRange(ctx, selectedObject.value as Beacon)
    }
    else if (selectedObject.value.type === 'client') {
      drawClientCircles(ctx, selectedObject.value as Client)
      drawClientConnections(ctx, selectedObject.value as Client)
    }
  }
  else if (selectedObjects.value.length > 0) {
    // 多选时，为每个客户端绘制信号圈和连线
    selectedObjects.value.forEach((obj) => {
      if (obj.type === 'client') {
        drawClientCircles(ctx, obj as Client)
        drawClientConnections(ctx, obj as Client)
      }
    })
  }

  // 绘制框选矩形
  if (boxSelection.value.isActive) {
    drawBoxSelection(ctx)
  }
}

// 绘制网格层（只在初始化和参数变化时重绘）
function drawGrid(): void {
  const gridCanvas = gridCanvasRef.value
  if (!gridCanvas)
    return

  const ctx = gridCanvas.getContext('2d')
  if (!ctx)
    return

  ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height)
  drawGridLines(ctx, gridCanvas)
}

function drawGridLines(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
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

  const isMultiSelected = selectedObjects.value.some(obj =>
    obj.id === b.id && obj.type === 'beacon',
  )

  ctx.beginPath()
  ctx.arc(b.x, b.y, BEACON_DEFAULTS.radius, 0, 2 * Math.PI)
  ctx.fillStyle = BEACON_DEFAULTS.color
  ctx.fill()

  if (isSelected || isMultiSelected) {
    ctx.lineWidth = 3
    ctx.strokeStyle = isMultiSelected ? '#f59e0b' : BEACON_DEFAULTS.selectedColor
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

  const isMultiSelected = selectedObjects.value.some(obj =>
    obj.id === c.id && obj.type === 'client',
  )

  const size = CLIENT_DEFAULTS.value.size
  ctx.fillStyle = CLIENT_DEFAULTS.value.color
  ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size)

  if (isSelected || isMultiSelected) {
    ctx.lineWidth = 3
    ctx.strokeStyle = isMultiSelected ? '#f59e0b' : CLIENT_DEFAULTS.value.selectedColor
    ctx.strokeRect(c.x - size / 2, c.y - size / 2, size, size)
  }

  ctx.fillStyle = isDark.value ? '#e5e7eb' : '#000'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`C${c.id}`, c.x, c.y + size / 2 + 12)
}

function drawBeaconRange(ctx: CanvasRenderingContext2D, beacon: Beacon): void {
  const distance3D = calculate3DDistanceFromRSSI(beacon, clientRssiThreshold.value)
  const heightDiff = beacon.z - CLIENT_DEFAULTS.value.z
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

// 绘制框选矩形
function drawBoxSelection(ctx: CanvasRenderingContext2D): void {
  const { startX, startY, endX, endY } = boxSelection.value
  const width = endX - startX
  const height = endY - startY

  // 绘制半透明填充
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
  ctx.fillRect(startX, startY, width, height)

  // 绘制边框
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(startX, startY, width, height)
  ctx.setLineDash([])
}

// 交互处理
function getObjectAt(x: number, y: number): SelectedObject {
  for (let i = clients.value.length - 1; i >= 0; i--) {
    const c = clients.value[i]
    const size = CLIENT_DEFAULTS.value.size
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

// 获取框选区域内的所有对象
function getObjectsInBox(x1: number, y1: number, x2: number, y2: number): (Beacon | Client)[] {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  const selectedObjects: (Beacon | Client)[] = []

  // 检查信标
  beacons.value.forEach((beacon) => {
    if (beacon.x >= minX && beacon.x <= maxX && beacon.y >= minY && beacon.y <= maxY) {
      selectedObjects.push(beacon)
    }
  })

  // 检查客户端
  clients.value.forEach((client) => {
    const size = CLIENT_DEFAULTS.value.size
    const halfSize = size / 2
    if (client.x - halfSize >= minX && client.x + halfSize <= maxX
      && client.y - halfSize >= minY && client.y + halfSize <= maxY) {
      selectedObjects.push(client)
    }
  })

  return selectedObjects
}

// 清除多选
function clearSelection(): void {
  selectedObjects.value = []
  selectedObject.value = null
}

// 设置多选状态
function setMultiSelection(objects: (Beacon | Client)[]): void {
  selectedObjects.value = objects
  // 如果只选中一个对象，同时设置selectedObject以保持兼容性
  if (objects.length === 1) {
    selectedObject.value = objects[0]
  }
  else {
    selectedObject.value = null
  }
}

function handleMouseDown(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  // 如果按住Ctrl键（Mac）或Meta键，添加到多选
  const isCtrlPressed = e.ctrlKey || e.metaKey
  const clickedObject = getObjectAt(mouseX, mouseY)

  if (clickedObject) {
    if (isCtrlPressed) {
      // Ctrl/Cmd + 点击：添加/移除多选
      const existingIndex = selectedObjects.value.findIndex(obj =>
        obj.id === clickedObject.id && obj.type === clickedObject.type,
      )

      if (existingIndex >= 0) {
        // 已选中，移除
        selectedObjects.value.splice(existingIndex, 1)
      }
      else {
        // 未选中，添加
        selectedObjects.value.push(clickedObject)
      }

      setMultiSelection(selectedObjects.value)
    }
    else {
      // 普通点击：如果点击的对象已在多选中，保持多选，否则开始新的单选
      const isAlreadySelected = selectedObjects.value.some(obj =>
        obj.id === clickedObject.id && obj.type === clickedObject.type,
      )

      if (!isAlreadySelected) {
        setMultiSelection([clickedObject])
      }

      isDragging.value = true
      canvas.style.cursor = 'grabbing'
      dragOffsetX.value = mouseX - clickedObject.x
      dragOffsetY.value = mouseY - clickedObject.y
    }
  }
  else {
    // 点击空白区域：开始框选或清除选择
    if (!isCtrlPressed) {
      clearSelection()
    }

    isBoxSelecting.value = true
    boxSelection.value = {
      startX: mouseX,
      startY: mouseY,
      endX: mouseX,
      endY: mouseY,
      isActive: true,
    }
    canvas.style.cursor = 'crosshair'
  }

  draw()
}

function handleMouseMove(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  if (isDragging.value && (selectedObject.value || selectedObjects.value.length > 0)) {
    let shouldInvalidateCoverageCache = false

    // 多选拖拽
    if (selectedObjects.value.length > 0) {
      const deltaX = mouseX - dragOffsetX.value - selectedObjects.value[0].x
      const deltaY = mouseY - dragOffsetY.value - selectedObjects.value[0].y

      // 检查是否拖拽了信标
      const hasBeacons = selectedObjects.value.some(obj => obj.type === 'beacon')
      shouldInvalidateCoverageCache = hasBeacons

      selectedObjects.value.forEach((obj) => {
        obj.x += deltaX
        obj.y += deltaY
      })

      dragOffsetX.value = mouseX - selectedObjects.value[0].x
      dragOffsetY.value = mouseY - selectedObjects.value[0].y
    }
    else if (selectedObject.value) {
      // 单选拖拽（保持兼容性）
      const isBeacon = selectedObject.value.type === 'beacon'
      shouldInvalidateCoverageCache = isBeacon

      selectedObject.value.x = mouseX - dragOffsetX.value
      selectedObject.value.y = mouseY - dragOffsetY.value
    }

    // 如果拖拽了信标，清除覆盖范围缓存
    if (shouldInvalidateCoverageCache) {
      coverageAreaCache.value.canvas = null
    }

    // 使用requestAnimationFrame优化拖拽重绘
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
    }
    animationFrameId.value = requestAnimationFrame(() => {
      draw()
      animationFrameId.value = null
    })
  }
  else if (isBoxSelecting.value) {
    // 更新框选矩形
    boxSelection.value.endX = mouseX
    boxSelection.value.endY = mouseY
    draw()
  }
}

function handleMouseUp(): void {
  const canvas = canvasRef.value

  if (isBoxSelecting.value) {
    // 完成框选
    const objectsInBox = getObjectsInBox(
      boxSelection.value.startX,
      boxSelection.value.startY,
      boxSelection.value.endX,
      boxSelection.value.endY,
    )

    if (objectsInBox.length > 0) {
      setMultiSelection(objectsInBox)
    }

    // 重置框选状态
    isBoxSelecting.value = false
    boxSelection.value.isActive = false
  }

  isDragging.value = false
  if (canvas) {
    canvas.style.cursor = 'grab'
  }

  // 清理动画帧
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
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
  if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedObject.value || selectedObjects.value.length > 0)) {
    e.preventDefault()
    if (selectedObjects.value.length > 0) {
      deleteMultipleObjects(selectedObjects.value)
    }
    else if (selectedObject.value) {
      deleteObject(selectedObject.value)
    }
  }

  // ESC键清除选择
  if (e.key === 'Escape') {
    clearSelection()
    draw()
  }
}

// 场景居中算法
function centerScene(): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const canvasWidth = canvas.width
  const canvasHeight = canvas.height
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  // 收集所有对象的位置
  const allObjects = [...beacons.value, ...clients.value]
  if (allObjects.length === 0)
    return

  // 计算场景的边界
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  allObjects.forEach((obj) => {
    minX = Math.min(minX, obj.x)
    maxX = Math.max(maxX, obj.x)
    minY = Math.min(minY, obj.y)
    maxY = Math.max(maxY, obj.y)
  })

  // 计算场景的中心点
  const sceneCenterX = (minX + maxX) / 2
  const sceneCenterY = (minY + maxY) / 2

  // 计算偏移量（需要移动的距离）
  const offsetX = centerX - sceneCenterX
  const offsetY = centerY - sceneCenterY

  // 应用偏移量到所有对象
  allObjects.forEach((obj) => {
    obj.x += offsetX
    obj.y += offsetY
  })
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
    z: CLIENT_DEFAULTS.value.z,
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

  // 从多选中移除
  selectedObjects.value = selectedObjects.value.filter(selectedObj =>
    !(selectedObj.id === obj.id && selectedObj.type === obj.type),
  )

  draw()
}

function deleteMultipleObjects(objects: (Beacon | Client)[]): void {
  if (!objects || objects.length === 0)
    return

  objects.forEach((obj) => {
    if (obj.type === 'beacon') {
      beacons.value = beacons.value.filter(b => b.id !== obj.id)
    }
    else if (obj.type === 'client') {
      clients.value = clients.value.filter(c => c.id !== obj.id)
    }
  })

  // 清除选择状态
  clearSelection()
  draw()
}

function updateAllBeaconsHeight(): void {
  if (beacons.value.length === 0) {
    showMessage('当前没有信标可以更新', 'warning')
    return
  }

  const oldHeight = beacons.value[0]?.z || 0
  const newHeight = beaconHeight.value

  beacons.value.forEach((beacon) => {
    beacon.z = newHeight
  })

  draw()
  showSuccess(`已将所有信标高度从 ${oldHeight}m 更新为 ${newHeight}m`)
}

function updateAllClientsHeight(): void {
  if (clients.value.length === 0) {
    showMessage('当前没有客户端可以更新', 'warning')
    return
  }

  const oldHeight = clients.value[0]?.z || 0
  const newHeight = clientHeight.value

  clients.value.forEach((client) => {
    client.z = newHeight
  })

  draw()
  showSuccess(`已将所有客户端高度从 ${oldHeight}m 更新为 ${newHeight}m`)
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  const gridCanvas = gridCanvasRef.value
  const container = canvasContainerRef.value
  if (!canvas || !gridCanvas || !container)
    return

  const width = container.clientWidth - 20
  const height = container.clientHeight - 20

  // 设置两个画布的尺寸
  canvas.width = width
  canvas.height = height
  gridCanvas.width = width
  gridCanvas.height = height

  // 重绘网格层和动态层
  drawGrid()
  draw()
}

// 数据导入导出功能
function exportScene(): void {
  try {
    const dataStr = JSON.stringify(sceneData.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ibeacon-scene-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    showSuccess('场景已成功导出！')
  }
  catch (error) {
    console.error('导出场景失败:', error)
    showError('导出场景失败，请重试')
  }
}

function importScene(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // 验证数据格式
        if (!data.beacons || !data.clients || !data.settings) {
          throw new Error('无效的场景数据格式')
        }

        // 加载数据
        beacons.value = data.beacons || []
        clients.value = data.clients || []

        if (data.settings) {
          scale.value = data.settings.scale || 50
          beaconHeight.value = data.settings.beaconHeight || 3
          clientHeight.value = data.settings.clientHeight || 0.8
          beaconN.value = data.settings.beaconN || 2.5
          clientRssiThreshold.value = data.settings.clientRssiThreshold || -85
          showCoverageArea.value = data.settings.showCoverageArea || false
          coverageStep.value = data.settings.coverageStep || 10
        }

        // 更新ID计数器
        nextBeaconId.value = Math.max(...beacons.value.map(b => b.id), 0) + 1
        nextClientId.value = Math.max(...clients.value.map(c => c.id), 0) + 1

        selectedObject.value = null

        nextTick(() => {
          // 将导入的场景移动到画布中央
          centerScene()
          drawGrid()
          draw()
        })

        showSuccess('场景已成功导入！')
      }
      catch (error) {
        console.error('导入场景失败:', error)
        showError('导入场景失败，请检查文件格式')
      }
    }

    reader.readAsText(file)
  }

  input.click()
}

// 预设场景模板
const presetScenes = {
  hospital: {
    name: '医院环境',
    beacons: [
      { id: 1, type: 'beacon' as const, x: 100, y: 100, z: 3, txPower: -59 },
      { id: 2, type: 'beacon' as const, x: 300, y: 100, z: 3, txPower: -59 },
      { id: 3, type: 'beacon' as const, x: 500, y: 100, z: 3, txPower: -59 },
      { id: 4, type: 'beacon' as const, x: 100, y: 300, z: 3, txPower: -59 },
      { id: 5, type: 'beacon' as const, x: 300, y: 300, z: 3, txPower: -59 },
      { id: 6, type: 'beacon' as const, x: 500, y: 300, z: 3, txPower: -59 },
    ],
    clients: [
      { id: 1, type: 'client' as const, x: 200, y: 200, z: 0.8 },
    ],
    settings: { scale: 50, beaconHeight: 3, clientHeight: 0.8, beaconN: 2.5, clientRssiThreshold: -85, showCoverageArea: false, coverageStep: 10 },
  },
  office: {
    name: '办公室环境',
    beacons: [
      { id: 1, type: 'beacon' as const, x: 150, y: 150, z: 2.5, txPower: -59 },
      { id: 2, type: 'beacon' as const, x: 450, y: 150, z: 2.5, txPower: -59 },
      { id: 3, type: 'beacon' as const, x: 150, y: 350, z: 2.5, txPower: -59 },
      { id: 4, type: 'beacon' as const, x: 450, y: 350, z: 2.5, txPower: -59 },
    ],
    clients: [
      { id: 1, type: 'client' as const, x: 300, y: 250, z: 0.8 },
      { id: 2, type: 'client' as const, x: 200, y: 200, z: 0.8 },
    ],
    settings: { scale: 50, beaconHeight: 2.5, clientHeight: 0.8, beaconN: 2.0, clientRssiThreshold: -80, showCoverageArea: false, coverageStep: 10 },
  },
  warehouse: {
    name: '仓库环境',
    beacons: [
      { id: 1, type: 'beacon' as const, x: 100, y: 100, z: 5, txPower: -65 },
      { id: 2, type: 'beacon' as const, x: 300, y: 100, z: 5, txPower: -65 },
      { id: 3, type: 'beacon' as const, x: 500, y: 100, z: 5, txPower: -65 },
      { id: 4, type: 'beacon' as const, x: 100, y: 300, z: 5, txPower: -65 },
      { id: 5, type: 'beacon' as const, x: 300, y: 300, z: 5, txPower: -65 },
      { id: 6, type: 'beacon' as const, x: 500, y: 300, z: 5, txPower: -65 },
      { id: 7, type: 'beacon' as const, x: 200, y: 450, z: 5, txPower: -65 },
      { id: 8, type: 'beacon' as const, x: 400, y: 450, z: 5, txPower: -65 },
    ],
    clients: [
      { id: 1, type: 'client' as const, x: 300, y: 300, z: 1.2 },
    ],
    settings: { scale: 50, beaconHeight: 5, clientHeight: 1.2, beaconN: 3.0, clientRssiThreshold: -90, showCoverageArea: false, coverageStep: 10 },
  },
}

function loadPresetScene(sceneType: keyof typeof presetScenes): void {
  try {
    const scene = presetScenes[sceneType]

    // 清空当前场景
    beacons.value = []
    clients.value = []
    selectedObject.value = null

    // 加载预设场景
    beacons.value = [...scene.beacons]
    clients.value = [...scene.clients]

    // 应用设置
    scale.value = scene.settings.scale
    beaconHeight.value = scene.settings.beaconHeight
    clientHeight.value = scene.settings.clientHeight
    beaconN.value = scene.settings.beaconN
    clientRssiThreshold.value = scene.settings.clientRssiThreshold
    showCoverageArea.value = scene.settings.showCoverageArea
    coverageStep.value = scene.settings.coverageStep

    // 更新ID计数器
    nextBeaconId.value = Math.max(...beacons.value.map(b => b.id), 0) + 1
    nextClientId.value = Math.max(...clients.value.map(c => c.id), 0) + 1

    nextTick(() => {
      // 将场景移动到画布中央
      centerScene()
      drawGrid()
      draw()
    })

    showSuccess(`已加载${scene.name}预设场景`)
  }
  catch (error) {
    console.error('加载预设场景失败:', error)
    showError('加载预设场景失败，请重试')
  }
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    // 先加载本地存储的数据
    loadFromLocalStorage()
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
    <!-- 消息提示 -->
    <NAlert
      v-if="messageInfo.show"
      :type="messageInfo.type"
      closable
      class="max-w-md transform left-1/2 top-4 fixed z-50 -translate-x-1/2"
      @close="messageInfo.show = false"
    >
      {{ messageInfo.content }}
    </NAlert>

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
          <div ref="canvasContainerRef" rounded-lg bg-white flex h-full shadow-md items-center justify-center relative dark:bg-gray-800 dark:shadow-gray-700>
            <!-- 网格层 -->
            <canvas
              ref="gridCanvasRef"

              pointer-events-none left-2 top-2 absolute
            />
            <!-- 动态元素层 -->
            <canvas
              ref="canvasRef"

              bg-transparent cursor-grab relative
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
              <div flex gap-2>
                <NInputNumber
                  v-model:value="beaconHeight"
                  :min="0"
                  :max="20"
                  :step="0.1"
                  placeholder="信标高度"
                  @update:value="draw"
                />
                <NButton
                  size="small"
                  type="primary"
                  :disabled="beacons.length === 0"
                  @click="updateAllBeaconsHeight"
                >
                  应用到所有信标
                </NButton>
              </div>
              <div text-xs text-gray-500 mt-1 dark:text-gray-400>
                修改只影响新增信标，点击"应用到所有信标"更新现有信标
              </div>
            </div>

            <div mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>客户端默认高度 (米):</label>
              <div flex gap-2>
                <NInputNumber
                  v-model:value="clientHeight"
                  :min="0"
                  :max="20"
                  :step="0.1"
                  placeholder="客户端高度"
                  @update:value="draw"
                />
                <NButton
                  size="small"
                  type="primary"
                  :disabled="clients.length === 0"
                  @click="updateAllClientsHeight"
                >
                  应用到所有客户端
                </NButton>
              </div>
              <div text-xs text-gray-500 mt-1 dark:text-gray-400>
                修改只影响新增客户端，点击"应用到所有客户端"更新现有客户端
              </div>
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

            <div mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>显示定位覆盖范围:</label>
              <NSwitch
                v-model:value="showCoverageArea"
                @update:value="draw"
              >
                <template #checked>
                  显示
                </template>
                <template #unchecked>
                  隐藏
                </template>
              </NSwitch>
            </div>

            <div v-if="showCoverageArea" mb-3>
              <label text-gray-700 font-medium mb-1 block dark:text-gray-300>采样步长 (像素):</label>
              <NInputNumber
                v-model:value="coverageStep"
                :min="5"
                :max="50"
                :step="1"
                placeholder="采样步长"
                @update:value="draw"
              />
              <div text-xs text-gray-500 mt-1 dark:text-gray-400>
                较小的值提供更高精度但性能较差，较大的值性能更好但精度较低
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div mb-5>
            <h3 text-lg text-blue-500 font-semibold mb-3 dark:text-blue-400>
              操作
            </h3>
            <NSpace vertical>
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
              <NSpace>
                <NButton
                  type="warning"
                  :disabled="selectedObjects.length === 0 && !selectedObject"
                  @click="clearSelection"
                >
                  清除选择
                </NButton>
                <NButton
                  type="error"
                  :disabled="selectedObjects.length === 0 && !selectedObject"
                  @click="selectedObjects.length > 0 ? deleteMultipleObjects(selectedObjects) : (selectedObject ? deleteObject(selectedObject) : null)"
                >
                  删除选中
                </NButton>
              </NSpace>
              <NSpace>
                <NButton type="info" @click="exportScene">
                  导出场景
                </NButton>
                <NButton type="warning" @click="importScene">
                  导入场景
                </NButton>
              </NSpace>

              <!-- 预设场景 -->
              <div>
                <label text-gray-700 font-medium mb-1 block dark:text-gray-300>预设场景模板:</label>
                <NSpace>
                  <NButton size="small" @click="loadPresetScene('hospital')">
                    医院环境
                  </NButton>
                  <NButton size="small" @click="loadPresetScene('office')">
                    办公室
                  </NButton>
                  <NButton size="small" @click="loadPresetScene('warehouse')">
                    仓库
                  </NButton>
                </NSpace>
              </div>
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
              <!-- 多选设备信息 -->
              <div v-if="infoPanelData.type === 'multi-selection'">
                <h3 text="blue-600" dark:text="blue-400" font-medium>
                  已选中 {{ infoPanelData.totalCount }} 个对象
                </h3>

                <div v-if="infoPanelData.beacons?.length > 0" mt-3>
                  <h4 text="blue-500" text-sm font-medium>
                    信标 ({{ infoPanelData.beacons.length }}个)
                  </h4>
                  <ul mt-2 pl-5 space-y-1>
                    <li v-for="beacon in infoPanelData.beacons" :key="`beacon-${beacon.id}`" text-sm>
                      B{{ beacon.id }}: ({{ beacon.x }}m, {{ beacon.y }}m)
                    </li>
                  </ul>
                </div>

                <div v-if="infoPanelData.clients?.length > 0" mt-3>
                  <h4 text="green-500" text-sm font-medium>
                    客户端 ({{ infoPanelData.clients.length }}个)
                  </h4>
                  <ul mt-2 pl-5 space-y-1>
                    <li v-for="client in infoPanelData.clients" :key="`client-${client.id}`" text-sm>
                      C{{ client.id }}: ({{ client.x }}m, {{ client.y }}m)
                    </li>
                  </ul>
                </div>

                <p text="gray-500" text-sm mt-3>
                  按Delete键可删除所有选中对象，按ESC键清除选择。
                </p>
              </div>

              <!-- 操作说明 -->
              <div v-else-if="infoPanelData.type === 'instructions'">
                <p font-medium>
                  操作说明：
                </p>
                <ul mt-2 pl-5 list-disc space-y-1>
                  <li>点击设备进行选择</li>
                  <li>按住Ctrl/Cmd键点击可多选设备</li>
                  <li>在空白区域拖拽可框选多个设备</li>
                  <li>选中设备后可拖拽移动</li>
                  <li>按Delete键删除选中设备</li>
                  <li>按ESC键清除选择</li>
                  <li>双击设备可快速删除</li>
                </ul>
                <p text="gray-500" text-sm mt-3>
                  在画布上点击一个信标或客户端以查看详情。
                </p>
              </div>

              <!-- 信标详情 -->
              <div v-else-if="infoPanelData.type === 'beacon'">
                <h3 text="blue-600" dark:text="blue-400" font-medium>
                  信标 B{{ infoPanelData.id }}
                </h3>
                <ul mt-3 space-y-2>
                  <li text-sm>
                    位置 (px): ({{ infoPanelData.x }}, {{ infoPanelData.y }})
                  </li>
                  <li text-sm>
                    位置 (m): ({{ infoPanelData.xM }}, {{ infoPanelData.yM }})
                  </li>
                  <li text-sm>
                    高度 (m): {{ infoPanelData.z }}
                  </li>
                  <li text-sm>
                    TxPower (dBm): {{ infoPanelData.txPower }} (1米处RSSI)
                  </li>
                </ul>
              </div>

              <!-- 客户端详情 -->
              <div v-else-if="infoPanelData.type === 'client'">
                <h3 text="green-600" dark:text="green-400" font-medium>
                  客户端 C{{ infoPanelData.id }}
                </h3>
                <ul mt-3 space-y-2>
                  <li text-sm>
                    位置 (px): ({{ infoPanelData.x }}, {{ infoPanelData.y }})
                  </li>
                  <li text-sm>
                    位置 (m): ({{ infoPanelData.xM }}, {{ infoPanelData.yM }})
                  </li>
                  <li text-sm>
                    高度 (m): {{ infoPanelData.z }}
                  </li>
                </ul>
                <h4 text-sm font-medium mt-4>
                  接收到的信号强度:
                </h4>
                <ul mt-2 space-y-1>
                  <li
                    v-for="data in infoPanelData.rssiData"
                    :key="`rssi-${data.beaconId}`"
                    text-sm
                    :text="data.isAudible ? 'green-600' : 'red-600'"
                    font-medium
                  >
                    来自 B{{ data.beaconId }}: {{ data.rssi }} dBm
                  </li>
                  <li v-if="infoPanelData.rssiData?.length === 0" text="gray-500" text-sm>
                    无可用信标
                  </li>
                </ul>
              </div>
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
              <!-- 无客户端时的提示 -->
              <div v-if="formulaPanelData.type === 'empty'">
                <p text-gray-500>
                  点击一个客户端以查看计算过程。
                </p>
              </div>

              <!-- 信号不足时的提示 -->
              <div v-else-if="formulaPanelData.type === 'insufficient'">
                <p>
                  至少需要接收到3个信标的信号才能进行三角定位。
                  客户端C{{ formulaPanelData.clientId }}当前接收到 {{ formulaPanelData.count }} 个。
                </p>
              </div>

              <!-- 计算过程展示 -->
              <div v-else-if="formulaPanelData.type === 'calculation'">
                <h3 text="blue-600" dark:text="blue-400" font-medium mb-4>
                  C{{ formulaPanelData.clientId }} 的三角定位计算
                </h3>

                <p font-medium mb-3>
                  第1步: 根据RSSI计算与每个信标的2D平面距离 (d)
                </p>

                <div space-y-4>
                  <div v-for="beacon in formulaPanelData.beaconData" :key="`calc-${beacon.beaconId}`">
                    <p font-medium>
                      对于信标 B{{ beacon.beaconId }}:
                    </p>
                    <code
                      text-xs leading-relaxed font-mono p-3 rounded bg-gray-100 block whitespace-pre-wrap dark:bg-gray-800
                    >
                      RSSI = {{ beacon.receivedRssi }} dBm
                      TxPower = {{ beacon.txPower }} dBm, n = {{ formulaPanelData.n }}
                      3D距离 = 10^(({{ beacon.txPower }} - ({{ beacon.receivedRssi }})) / (10 * {{ formulaPanelData.n }}))
                      = {{ beacon.distance3D }} 米

                      平面距离 d{{ beacon.beaconId }} = sqrt( (3D距离)² - (高度差)² )
                      = sqrt( {{ beacon.distance3D }}² - ({{ beacon.heightDiff }})² )
                      = {{ beacon.distance2D }} 米
                    </code>
                  </div>
                </div>

                <p font-medium mb-3 mt-4>
                  第2步: 建立方程组求解客户端位置 (x, y)
                </p>
                <code

                  text-xs leading-relaxed font-mono p-3 rounded bg-gray-100 block whitespace-pre-wrap dark:bg-gray-800
                >
                  (x - x₁)² + (y - y₁)² = d₁²
                  (x - x₂)² + (y - y₂)² = d₂²
                  (x - x₃)² + (y - y₃)² = d₃²

                  代入数值:
                  (x - {{ formulaPanelData.beaconData[0]?.x }})² + (y - {{ formulaPanelData.beaconData[0]?.y }})² = {{ formulaPanelData.beaconData[0]?.distance2D }}²
                  (x - {{ formulaPanelData.beaconData[1]?.x }})² + (y - {{ formulaPanelData.beaconData[1]?.y }})² = {{ formulaPanelData.beaconData[1]?.distance2D }}²
                  (x - {{ formulaPanelData.beaconData[2]?.x }})² + (y - {{ formulaPanelData.beaconData[2]?.y }})² = {{ formulaPanelData.beaconData[2]?.distance2D }}²
                </code>
              </div>
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
