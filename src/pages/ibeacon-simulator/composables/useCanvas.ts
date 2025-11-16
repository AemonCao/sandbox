import type { Beacon, BoxSelection, Client } from './types'
import { ref } from 'vue'
import { isDark } from '~/composables'
import { useCalculations } from './useCalculations'

export function useCanvas() {
  const { calculateReceivedRSSI, calculate3DDistanceFromRSSI, calculate2DDistance } = useCalculations()

  // Canvas引用
  const canvasRef = ref<HTMLCanvasElement>()
  const gridCanvasRef = ref<HTMLCanvasElement>()
  const canvasContainerRef = ref<HTMLElement>()

  // 交互状态
  const isDragging = ref(false)
  const isBoxSelecting = ref(false)
  const dragOffsetX = ref(0)
  const dragOffsetY = ref(0)
  const boxSelection = ref<BoxSelection>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isActive: false,
  })

  // 覆盖范围缓存
  const coverageAreaCache = ref<{
    canvas: HTMLCanvasElement | null
    beaconsHash: string
    settingsHash: string
  }>({
    canvas: null,
    beaconsHash: '',
    settingsHash: '',
  })

  // 常量定义
  const BEACON_DEFAULTS = {
    txPower: -59,
    radius: 8,
    color: 'rgba(26, 115, 232, 0.8)',
    selectedColor: '#1a73e8',
  }

  const CLIENT_DEFAULTS = ref({
    size: 12,
    color: 'rgba(21, 128, 61, 0.8)',
    selectedColor: '#15803d',
  })

  // 计算信标和设置的哈希值
  function calculateBeaconsHash(beacons: Beacon[]): string {
    return beacons.map(b => `${b.id}-${b.x.toFixed(0)}-${b.y.toFixed(0)}-${b.z}-${b.txPower}`).join('|')
  }

  function calculateSettingsHash(scale: number, clientRssiThreshold: number, coverageStep: number, beaconN: number): string {
    return `${scale}-${clientRssiThreshold}-${coverageStep}-${beaconN}`
  }

  // 调整画布大小
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
  }

  // 绘制网格层
  function drawGrid(scale: number): void {
    const gridCanvas = gridCanvasRef.value
    if (!gridCanvas)
      return

    const ctx = gridCanvas.getContext('2d')
    if (!ctx)
      return

    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height)
    drawGridLines(ctx, gridCanvas, scale)
  }

  function drawGridLines(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scale: number): void {
    // 根据当前主题选择网格颜色
    ctx.strokeStyle = isDark.value ? '#374151' : '#e0e0e0'
    ctx.lineWidth = 0.5

    for (let x = 0; x < canvas.width; x += scale) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y < canvas.height; y += scale) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  // 绘制主画布
  function draw(
    beacons: Beacon[],
    clients: Client[],
    selectedObject: Beacon | Client | null,
    selectedObjects: (Beacon | Client)[],
    clientHeight: number,
    clientRssiThreshold: number,
    beaconN: number,
    showCoverageArea: boolean,
    coverageStep: number,
    scale: number,
  ): void {
    const canvas = canvasRef.value
    if (!canvas)
      return

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    // 清除动态层
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制定位覆盖范围（如果开启）
    if (showCoverageArea) {
      drawCoverageArea(ctx, beacons, clientHeight, clientRssiThreshold, beaconN, coverageStep, scale)
    }

    // 绘制动态元素（不包括网格）
    clients.forEach(c => drawClient(ctx, c, selectedObject, selectedObjects))
    beacons.forEach(b => drawBeacon(ctx, b, selectedObject, selectedObjects))

    // 绘制选中对象的特效
    if (selectedObject && selectedObjects.length <= 1) {
      // 单选时的特效
      if (selectedObject.type === 'beacon') {
        drawBeaconRange(ctx, selectedObject as Beacon, clientHeight, clientRssiThreshold, scale)
      }
      else if (selectedObject.type === 'client') {
        drawClientCircles(ctx, selectedObject as Client, beacons, clientHeight, clientRssiThreshold, beaconN, scale)
        drawClientConnections(ctx, selectedObject as Client, beacons, clientHeight, clientRssiThreshold, beaconN, scale)
      }
    }
    else if (selectedObjects.length > 0) {
      // 多选时，为每个客户端绘制信号圈和连线
      selectedObjects.forEach((obj) => {
        if (obj.type === 'client') {
          drawClientCircles(ctx, obj as Client, beacons, clientHeight, clientRssiThreshold, beaconN, scale)
          drawClientConnections(ctx, obj as Client, beacons, clientHeight, clientRssiThreshold, beaconN, scale)
        }
      })
    }

    // 绘制框选矩形
    if (boxSelection.value.isActive) {
      drawBoxSelection(ctx)
    }
  }

  // 绘制定位覆盖范围
  function drawCoverageArea(
    ctx: CanvasRenderingContext2D,
    beacons: Beacon[],
    clientHeight: number,
    clientRssiThreshold: number,
    beaconN: number,
    coverageStep: number,
    scale: number,
  ): void {
    if (beacons.length < 3)
      return

    const canvas = canvasRef.value
    if (!canvas)
      return

    const width = canvas.width
    const height = canvas.height
    const step = coverageStep

    // 计算当前信标和设置的哈希值
    const currentBeaconsHash = calculateBeaconsHash(beacons)
    const currentSettingsHash = calculateSettingsHash(scale, clientRssiThreshold, coverageStep, beaconN)

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
          z: clientHeight,
        }

        // 计算能接收到的信号数量
        const audibleBeacons = beacons.filter(beacon =>
          calculateReceivedRSSI(beacon, testClient, scale, beaconN) >= clientRssiThreshold,
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

  // 绘制信标
  function drawBeacon(ctx: CanvasRenderingContext2D, b: Beacon, selectedObject: Beacon | Client | null, selectedObjects: (Beacon | Client)[]): void {
    const isSelected = selectedObject
      && selectedObject.id === b.id
      && selectedObject.type === 'beacon'

    const isMultiSelected = selectedObjects.some(obj =>
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

  // 绘制客户端
  function drawClient(ctx: CanvasRenderingContext2D, c: Client, selectedObject: Beacon | Client | null, selectedObjects: (Beacon | Client)[]): void {
    const isSelected = selectedObject
      && selectedObject.id === c.id
      && selectedObject.type === 'client'

    const isMultiSelected = selectedObjects.some(obj =>
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

  // 绘制信标范围
  function drawBeaconRange(ctx: CanvasRenderingContext2D, beacon: Beacon, clientHeight: number, clientRssiThreshold: number, scale: number): void {
    const distance3D = calculate3DDistanceFromRSSI(beacon, clientRssiThreshold, 2.5) // 使用默认的beaconN值
    const heightDiff = beacon.z - clientHeight
    const distance2D = calculate2DDistance(distance3D, heightDiff)
    const radiusPx = distance2D * scale

    ctx.beginPath()
    ctx.arc(beacon.x, beacon.y, radiusPx, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 绘制客户端信号圈
  function drawClientCircles(ctx: CanvasRenderingContext2D, client: Client, beacons: Beacon[], clientHeight: number, clientRssiThreshold: number, beaconN: number, scale: number): void {
    beacons.forEach((beacon) => {
      const receivedRssi = calculateReceivedRSSI(beacon, client, scale, beaconN)
      if (receivedRssi >= clientRssiThreshold) {
        const distance3D = calculate3DDistanceFromRSSI(beacon, receivedRssi, beaconN)
        const heightDiff = beacon.z - client.z
        const distance2D = calculate2DDistance(distance3D, heightDiff)
        const radiusPx = distance2D * scale

        ctx.beginPath()
        ctx.arc(beacon.x, beacon.y, radiusPx, 0, 2 * Math.PI)
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.7)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
  }

  // 绘制客户端连线
  function drawClientConnections(ctx: CanvasRenderingContext2D, client: Client, beacons: Beacon[], clientHeight: number, clientRssiThreshold: number, beaconN: number, scale: number): void {
    beacons.forEach((beacon) => {
      const receivedRssi = calculateReceivedRSSI(beacon, client, scale, beaconN)
      if (receivedRssi >= clientRssiThreshold) {
        // 计算实际距离
        const dx = (beacon.x - client.x) / scale
        const dy = (beacon.y - client.y) / scale
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

  // 获取点击位置的对象
  function getObjectAt(x: number, y: number, beacons: Beacon[], clients: Client[]): Beacon | Client | null {
    for (let i = clients.length - 1; i >= 0; i--) {
      const c = clients[i]
      const size = CLIENT_DEFAULTS.value.size
      if (x >= c.x - size / 2 && x <= c.x + size / 2
        && y >= c.y - size / 2 && y <= c.y + size / 2) {
        return c
      }
    }

    for (let i = beacons.length - 1; i >= 0; i--) {
      const b = beacons[i]
      const dist = Math.sqrt((x - b.x) ** 2 + (y - b.y) ** 2)
      if (dist <= BEACON_DEFAULTS.radius) {
        return b
      }
    }
    return null
  }

  // 获取框选区域内的所有对象
  function getObjectsInBox(x1: number, y1: number, x2: number, y2: number, beacons: Beacon[], clients: Client[]): (Beacon | Client)[] {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    const selectedObjects: (Beacon | Client)[] = []

    // 检查信标
    beacons.forEach((beacon) => {
      if (beacon.x >= minX && beacon.x <= maxX && beacon.y >= minY && beacon.y <= maxY) {
        selectedObjects.push(beacon)
      }
    })

    // 检查客户端
    clients.forEach((client) => {
      const size = CLIENT_DEFAULTS.value.size
      const halfSize = size / 2
      if (client.x - halfSize >= minX && client.x + halfSize <= maxX
        && client.y - halfSize >= minY && client.y + halfSize <= maxY) {
        selectedObjects.push(client)
      }
    })

    return selectedObjects
  }

  return {
    // 状态
    canvasRef,
    gridCanvasRef,
    canvasContainerRef,
    isDragging,
    isBoxSelecting,
    dragOffsetX,
    dragOffsetY,
    boxSelection,
    coverageAreaCache,

    // 方法
    resizeCanvas,
    drawGrid,
    draw,
    drawBeacon,
    drawClient,
    drawBeaconRange,
    drawClientCircles,
    drawClientConnections,
    drawBoxSelection,
    drawCoverageArea,
    getObjectAt,
    getObjectsInBox,
  }
}
