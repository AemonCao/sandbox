<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

interface Props {
  beacons: any[]
  testPoints: any[]
  truePositions: any[]
  algorithmResults: any
  selectedAlgorithm: string
  visualizationMode: string
  showBeaconCoverage: boolean
  showTestPaths: boolean
  config: any
  algorithmConfigs: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'algorithmChange': [algorithm: string]
  'config-change': [algorithm: string, config: any]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLElement>()
const mousePosition = ref({ x: 0, y: 0 })
const hoveredObject = ref<any>(null)
const selectedObject = ref<any>(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 缩放和平移配置
const scale = ref(50) // 当前缩放比例
const offset = ref({ x: 0, y: 0 }) // 画布偏移
const isPanning = ref(false) // 是否正在拖拽平移
const lastMousePosition = ref({ x: 0, y: 0 }) // 上一次鼠标位置

// 颜色配置
const colors = {
  background: '#ffffff',
  grid: '#e5e7eb',
  text: '#374151',
  beacon: '#3b82f6',
  testPoint: '#ef4444',
  truePosition: '#10b981',
  algorithm: {
    trilateration: '#8b5cf6',
    fingerprinting: '#f59e0b',
    centroid: '#ec4899',
    weightedCentroid: '#06b6d4',
    kalmanFilter: '#84cc16',
    particleFilter: '#f97316',
  },
  coverage: 'rgba(59, 130, 246, 0.1)',
  path: 'rgba(239, 68, 68, 0.5)',
  heatmap: {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  },
}

// 计算属性
const beaconsWithCoverage = computed(() => {
  return props.beacons.map(beacon => ({
    ...beacon,
    coverageRadius: getBeaconCoverageRadius(beacon),
  }))
})

const algorithmPositions = computed(() => {
  const positions: any = {}

  Object.entries(props.algorithmResults).forEach(([algorithm, results]: [string, any]) => {
    if (results && results.length > 0) {
      positions[algorithm] = results.map((result: any, index: number) => ({
        ...result.position,
        confidence: result.confidence,
        error: result.error,
        truePosition: props.truePositions[index],
      }))
    }
  })

  return positions
})

// 绘制函数
function _draw() {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 设置背景
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  if (props.config.showGrid) {
    drawGrid(ctx)
  }

  // 绘制坐标轴
  if (props.config.showCoordinates) {
    drawCoordinates(ctx)
  }

  // 根据可视化模式绘制
  switch (props.visualizationMode) {
    case 'heatmap':
      drawHeatmap(ctx)
      break
    case 'accuracy':
      drawAccuracyVisualization(ctx)
      break
    case 'comparison':
      drawComparisonVisualization(ctx)
      break
    case 'overlay':
    default:
      drawOverlayVisualization(ctx)
      break
  }

  // 绘制交互元素
  drawInteractiveElements(ctx)
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  const { width, height } = canvasRef.value!
  const scale = props.config.scale

  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 0.5

  // 绘制网格线
  for (let x = 0; x <= width; x += scale) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += scale) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawCoordinates(ctx: CanvasRenderingContext2D) {
  const { width, height } = canvasRef.value!
  const scale = props.config.scale

  ctx.fillStyle = colors.text
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // 绘制X轴坐标
  for (let x = 0; x <= width; x += scale) {
    ctx.fillText((x / scale).toString(), x, height + 15)
  }

  // 绘制Y轴坐标
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let y = 0; y <= height; y += scale) {
    ctx.fillText((y / scale).toString(), -5, y)
  }
}

function drawOverlayVisualization(ctx: CanvasRenderingContext2D) {
  // 绘制信标覆盖范围
  if (props.showBeaconCoverage) {
    beaconsWithCoverage.value.forEach((beacon) => {
      drawBeaconCoverage(ctx, beacon)
    })
  }

  // 绘制信标
  beaconsWithCoverage.value.forEach((beacon) => {
    drawBeacon(ctx, beacon)
  })

  // 绘制测试路径
  if (props.showTestPaths && props.testPoints.length > 1) {
    drawTestPaths(ctx)
  }

  // 绘制真实位置
  props.truePositions.forEach((position, index) => {
    drawTruePosition(ctx, position, index)
  })

  // 绘制算法结果
  drawAlgorithmResults(ctx)
}

function drawComparisonVisualization(ctx: CanvasRenderingContext2D) {
  // 绘制所有算法结果的对比
  const algorithms = Object.keys(algorithmPositions.value)

  algorithms.forEach((algorithm, _algorithmIndex) => {
    const positions = algorithmPositions.value[algorithm]
    if (!positions)
      return

    const color = colors.algorithm[algorithm as keyof typeof colors.algorithm]

    positions.forEach((position: any, _index: number) => {
      const screenPos = worldToScreen(position.x, position.y)

      // 绘制算法位置
      ctx.fillStyle = `${color}80` // 半透明
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2)
      ctx.fill()

      // 绘制到真实位置的连线
      if (position.truePosition) {
        const trueScreenPos = worldToScreen(position.truePosition.x, position.truePosition.y)

        ctx.strokeStyle = `${color}40`
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(screenPos.x, screenPos.y)
        ctx.lineTo(trueScreenPos.x, trueScreenPos.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  })

  // 重新绘制信标和真实位置
  beaconsWithCoverage.value.forEach((beacon) => {
    drawBeacon(ctx, beacon)
  })

  props.truePositions.forEach((position, index) => {
    drawTruePosition(ctx, position, index)
  })
}

function drawAccuracyVisualization(ctx: CanvasRenderingContext2D) {
  // 绘制精度热力图
  const positions = algorithmPositions.value[props.selectedAlgorithm]
  if (!positions)
    return

  positions.forEach((position: any) => {
    const screenPos = worldToScreen(position.x, position.y)
    const normalizedError = Math.min(position.error / 10, 1) // 假设最大误差为10m

    let color
    if (normalizedError < 0.33) {
      color = colors.heatmap.low
    }
    else if (normalizedError < 0.67) {
      color = colors.heatmap.medium
    }
    else {
      color = colors.heatmap.high
    }

    // 绘制误差圆圈
    const radius = 10 + normalizedError * 20
    const gradient = ctx.createRadialGradient(
      screenPos.x,
      screenPos.y,
      0,
      screenPos.x,
      screenPos.y,
      radius,
    )
    gradient.addColorStop(0, `${color}80`)
    gradient.addColorStop(1, `${color}00`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
    ctx.fill()
  })

  // 重新绘制基础元素
  beaconsWithCoverage.value.forEach((beacon) => {
    drawBeacon(ctx, beacon)
  })

  props.truePositions.forEach((position, index) => {
    drawTruePosition(ctx, position, index)
  })
}

function drawHeatmap(ctx: CanvasRenderingContext2D) {
  // 生成热力图数据
  const heatmapData: any[] = []
  const gridSize = 10 // 热力图网格大小

  for (let x = 0; x < canvasRef.value!.width; x += gridSize) {
    for (let y = 0; y < canvasRef.value!.height; y += gridSize) {
      const worldPos = screenToWorld(x, y)
      const intensity = calculateHeatmapIntensity(worldPos.x, worldPos.y)

      if (intensity > 0) {
        heatmapData.push({ x, y, intensity })
      }
    }
  }

  // 绘制热力图
  heatmapData.forEach((data) => {
    const color = getHeatmapColor(data.intensity)
    ctx.fillStyle = color
    ctx.fillRect(data.x, data.y, gridSize, gridSize)
  })

  // 重新绘制基础元素
  beaconsWithCoverage.value.forEach((beacon) => {
    drawBeacon(ctx, beacon)
  })
}

function drawBeacon(ctx: CanvasRenderingContext2D, beacon: any) {
  const screenPos = worldToScreen(beacon.x, beacon.y)
  const radius = 8

  // 绘制信标圆圈
  ctx.fillStyle = beacon.color || colors.beacon
  ctx.beginPath()
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // 绘制信标边框
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  // 绘制信标标签
  ctx.fillStyle = colors.text
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(beacon.id, screenPos.x, screenPos.y + radius + 5)
}

function drawBeaconCoverage(ctx: CanvasRenderingContext2D, beacon: any) {
  const screenPos = worldToScreen(beacon.x, beacon.y)
  const coverageRadius = beacon.coverageRadius * props.config.scale

  // 绘制覆盖范围圆圈
  ctx.fillStyle = colors.coverage
  ctx.beginPath()
  ctx.arc(screenPos.x, screenPos.y, coverageRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `${colors.beacon}40`
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawTruePosition(ctx: CanvasRenderingContext2D, position: any, _index: number) {
  const screenPos = worldToScreen(position.x, position.y)
  const radius = 4

  // 绘制真实位置
  ctx.fillStyle = colors.truePosition
  ctx.beginPath()
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // 绘制十字标记
  ctx.strokeStyle = colors.truePosition
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(screenPos.x - radius - 2, screenPos.y)
  ctx.lineTo(screenPos.x + radius + 2, screenPos.y)
  ctx.moveTo(screenPos.x, screenPos.y - radius - 2)
  ctx.lineTo(screenPos.x, screenPos.y + radius + 2)
  ctx.stroke()
}

function drawTestPaths(ctx: CanvasRenderingContext2D) {
  if (props.testPoints.length < 2)
    return

  ctx.strokeStyle = colors.path
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])

  ctx.beginPath()
  const firstPoint = props.testPoints[0]
  const firstScreenPos = worldToScreen(firstPoint.x, firstPoint.y)
  ctx.moveTo(firstScreenPos.x, firstScreenPos.y)

  for (let i = 1; i < props.testPoints.length; i++) {
    const point = props.testPoints[i]
    const screenPos = worldToScreen(point.x, point.y)
    ctx.lineTo(screenPos.x, screenPos.y)
  }

  ctx.stroke()
  ctx.setLineDash([])
}

function drawAlgorithmResults(ctx: CanvasRenderingContext2D) {
  const positions = algorithmPositions.value[props.selectedAlgorithm]
  if (!positions)
    return

  const algorithmColor = colors.algorithm[props.selectedAlgorithm as keyof typeof colors.algorithm]

  positions.forEach((position: any, _index: number) => {
    const screenPos = worldToScreen(position.x, position.y)

    // 绘制算法结果位置
    ctx.fillStyle = algorithmColor
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(screenPos.x, screenPos.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制到真实位置的连线
    if (position.truePosition) {
      const trueScreenPos = worldToScreen(position.truePosition.x, position.truePosition.y)

      ctx.strokeStyle = `${algorithmColor}60`
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(screenPos.x, screenPos.y)
      ctx.lineTo(trueScreenPos.x, trueScreenPos.y)
      ctx.stroke()
      ctx.setLineDash([])

      // 显示误差
      const midX = (screenPos.x + trueScreenPos.x) / 2
      const midY = (screenPos.y + trueScreenPos.y) / 2

      ctx.fillStyle = colors.text
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${position.error.toFixed(1)}m`, midX, midY - 5)
    }
  })
}

function drawInteractiveElements(ctx: CanvasRenderingContext2D) {
  // 绘制悬停提示
  if (hoveredObject.value) {
    drawTooltip(ctx, hoveredObject.value)
  }

  // 绘制选中框
  if (selectedObject.value) {
    const screenPos = worldToScreen(selectedObject.value.x, selectedObject.value.y)

    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.strokeRect(screenPos.x - 15, screenPos.y - 15, 30, 30)
    ctx.setLineDash([])
  }
}

function drawTooltip(ctx: CanvasRenderingContext2D, object: any) {
  const screenPos = worldToScreen(object.x, object.y)
  const text = getTooltipText(object)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(screenPos.x + 15, screenPos.y - 30, 120, 25)

  ctx.fillStyle = '#ffffff'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, screenPos.x + 20, screenPos.y - 17)
}

// 坐标转换函数
function worldToScreen(worldX: number, worldY: number) {
  return {
    x: worldX * scale.value + offset.value.x,
    y: worldY * scale.value + offset.value.y,
  }
}

function screenToWorld(screenX: number, screenY: number) {
  return {
    x: (screenX - offset.value.x) / scale.value,
    y: (screenY - offset.value.y) / scale.value,
  }
}

// 计算理想的缩放比例和偏移，使所有内容都在视野内
function calculateOptimalView() {
  if (!canvasRef.value || !props.beacons?.length)
    return

  const canvas = canvasRef.value
  const padding = 50 // 边距

  // 收集所有点的世界坐标
  const allPoints: { x: number, y: number }[] = []

  // 添加信标
  props.beacons.forEach((beacon) => {
    allPoints.push({ x: beacon.x, y: beacon.y })
  })

  // 添加测试点
  if (props.testPoints) {
    props.testPoints.forEach((point) => {
      allPoints.push({ x: point.x, y: point.y })
    })
  }

  // 添加真实位置
  if (props.truePositions) {
    props.truePositions.forEach((position) => {
      allPoints.push({ x: position.x, y: position.y })
    })
  }

  if (allPoints.length === 0)
    return

  // 计算边界框
  const minX = Math.min(...allPoints.map(p => p.x))
  const maxX = Math.max(...allPoints.map(p => p.x))
  const minY = Math.min(...allPoints.map(p => p.y))
  const maxY = Math.max(...allPoints.map(p => p.y))

  const worldWidth = maxX - minX
  const worldHeight = maxY - minY

  // 计算适合画布的缩放比例
  const scaleX = (canvas.width - padding * 2) / worldWidth
  const scaleY = (canvas.height - padding * 2) / worldHeight
  const optimalScale = Math.min(scaleX, scaleY, 100) // 限制最大缩放为100

  // 计算居中的偏移
  const worldCenterX = (minX + maxX) / 2
  const worldCenterY = (minY + maxY) / 2
  const canvasCenterX = canvas.width / 2
  const canvasCenterY = canvas.height / 2

  scale.value = Math.max(optimalScale, 10) // 最小缩放为10
  offset.value = {
    x: canvasCenterX - worldCenterX * scale.value,
    y: canvasCenterY - worldCenterY * scale.value,
  }

  console.warn('计算最佳视图:', {
    worldBounds: { minX, maxX, minY, maxY },
    optimalScale: scale.value,
    offset: offset.value,
  })
}

// 辅助函数
function getBeaconCoverageRadius(beacon: any): number {
  const detectionThreshold = -85
  const distance = 10 ** ((beacon.txPower - detectionThreshold) / (10 * beacon.n))
  return distance
}

function calculateHeatmapIntensity(x: number, y: number): number {
  // 基于与信标的距离计算热力图强度
  let maxIntensity = 0

  beaconsWithCoverage.value.forEach((beacon) => {
    const distance = Math.sqrt((x - beacon.x) ** 2 + (y - beacon.y) ** 2)
    const normalizedDistance = Math.max(0, 1 - distance / beacon.coverageRadius)
    maxIntensity = Math.max(maxIntensity, normalizedDistance)
  })

  return maxIntensity
}

function getHeatmapColor(intensity: number): string {
  // 将强度映射到颜色
  const r = Math.floor(255 * intensity)
  const g = Math.floor(255 * (1 - intensity))
  const b = 0

  return `rgba(${r}, ${g}, ${b}, 0.3)`
}

function getTooltipText(object: any): string {
  if (object.id && object.id.startsWith('beacon')) {
    return `${object.id} (${object.x.toFixed(1)}, ${object.y.toFixed(1)})`
  }
  else if (object.id && object.id.startsWith('point')) {
    return `${object.id} (${object.x.toFixed(1)}, ${object.y.toFixed(1)})`
  }
  return `${object.x.toFixed(1)}, ${object.y.toFixed(1)}`
}

// 事件处理
function handleMouseMove(event: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  mousePosition.value = { x, y }

  // 处理平移拖拽
  if (isPanning.value) {
    const deltaX = x - lastMousePosition.value.x
    const deltaY = y - lastMousePosition.value.y

    offset.value.x += deltaX
    offset.value.y += deltaY

    lastMousePosition.value = { x, y }

    // 重新绘制
    simpleDraw()
    return
  }

  // 检测悬停对象
  const worldPos = screenToWorld(x, y)
  hoveredObject.value = detectObjectAt(worldPos.x, worldPos.y)

  // 处理对象拖拽
  if (isDragging.value && selectedObject.value) {
    selectedObject.value.x = worldPos.x - dragOffset.value.x
    selectedObject.value.y = worldPos.y - dragOffset.value.y

    // 更新相应的数据源
    updateObjectPosition(selectedObject.value)
  }
}

function handleMouseDown(event: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 右键开始平移
  if (event.button === 2) {
    event.preventDefault()
    isPanning.value = true
    lastMousePosition.value = { x, y }
    return
  }

  const worldPos = screenToWorld(x, y)
  const object = detectObjectAt(worldPos.x, worldPos.y)

  if (object) {
    selectedObject.value = object
    isDragging.value = true
    dragOffset.value = {
      x: worldPos.x - object.x,
      y: worldPos.y - object.y,
    }
  }
  else {
    selectedObject.value = null
  }
}

function handleMouseUp() {
  isDragging.value = false
  isPanning.value = false
}

function handleClick(_event: MouseEvent) {
  if (!isDragging.value && hoveredObject.value) {
    // 如果是测试点，切换选中的算法
    if (hoveredObject.value.id && hoveredObject.value.id.startsWith('point')) {
      const algorithms = Object.keys(props.algorithmResults)
      const currentIndex = algorithms.indexOf(props.selectedAlgorithm)
      const nextIndex = (currentIndex + 1) % algorithms.length
      emit('algorithmChange', algorithms[nextIndex])
    }
  }
}

// 滚轮缩放事件处理
function handleWheel(event: WheelEvent) {
  event.preventDefault()

  const rect = canvasRef.value!.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 计算鼠标位置对应的世界坐标
  const worldPos = screenToWorld(mouseX, mouseY)

  // 缩放因子
  const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(5, Math.min(200, scale.value * scaleFactor)) // 限制缩放范围

  // 计算新的偏移，使鼠标位置保持在同一点
  const newOffsetX = mouseX - worldPos.x * newScale
  const newOffsetY = mouseY - worldPos.y * newScale

  scale.value = newScale
  offset.value = { x: newOffsetX, y: newOffsetY }

  // 重新绘制
  simpleDraw()
}

function detectObjectAt(worldX: number, worldY: number): any {
  const threshold = 0.5 // 检测阈值

  // 检测信标
  for (const beacon of beaconsWithCoverage.value) {
    const distance = Math.sqrt((worldX - beacon.x) ** 2 + (worldY - beacon.y) ** 2)
    if (distance < threshold) {
      return beacon
    }
  }

  // 检测测试点
  for (const point of props.testPoints) {
    const distance = Math.sqrt((worldX - point.x) ** 2 + (worldY - point.y) ** 2)
    if (distance < threshold) {
      return point
    }
  }

  return null
}

function updateObjectPosition(_object: any) {
  // 这里应该调用父组件的方法来更新数据
  // 暂时留空，实际实现时需要与父组件通信
}

// 生命周期
onMounted(() => {
  setTimeout(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    console.warn('AlgorithmCanvas mounted, refs:', {
      canvasRef: !!canvasRef.value,
      containerRef: !!containerRef.value,
      beacons: props.beacons?.length || 0,
      testPoints: props.testPoints?.length || 0,
    })

    // 计算最佳视图并绘制
    calculateOptimalView()
    simpleDraw()
  }, 100)
})

// 简化的绘制函数
function simpleDraw() {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 设置背景
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  if (props.config.showGrid) {
    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 0.5

    // 计算网格线的起始和结束位置
    const startX = Math.floor(-offset.value.x / scale.value) * scale.value + offset.value.x
    const startY = Math.floor(-offset.value.y / scale.value) * scale.value + offset.value.y
    const endX = canvas.width + scale.value
    const endY = canvas.height + scale.value

    for (let x = startX; x < endX; x += scale.value) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = startY; y < endY; y += scale.value) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  // 直接绘制信标
  if (props.beacons && props.beacons.length > 0) {
    props.beacons.forEach((beacon) => {
      const screenPos = worldToScreen(beacon.x, beacon.y)

      // 绘制信标圆圈
      ctx.fillStyle = beacon.color || colors.beacon
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI * 2)
      ctx.fill()

      // 绘制信标边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      console.warn('绘制信标:', beacon.id, '位置:', screenPos)
    })
  }

  // 直接绘制测试点
  if (props.testPoints && props.testPoints.length > 0) {
    props.testPoints.forEach((point) => {
      const screenPos = worldToScreen(point.x, point.y)

      // 绘制测试点
      ctx.fillStyle = colors.testPoint
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2)
      ctx.fill()

      console.warn('绘制测试点:', point.id, '位置:', screenPos)
    })
  }

  // 绘制真实位置
  if (props.truePositions && props.truePositions.length > 0) {
    props.truePositions.forEach((position, index) => {
      const screenPos = worldToScreen(position.x, position.y)

      // 绘制真实位置
      ctx.fillStyle = colors.truePosition
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2)
      ctx.fill()

      // 绘制十字标记
      ctx.strokeStyle = colors.truePosition
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(screenPos.x - 6, screenPos.y)
      ctx.lineTo(screenPos.x + 6, screenPos.y)
      ctx.moveTo(screenPos.x, screenPos.y - 6)
      ctx.lineTo(screenPos.x, screenPos.y + 6)
      ctx.stroke()

      console.warn('绘制真实位置:', index, '位置:', screenPos)
    })
  }

  console.warn('simpleDraw完成')
}

watch(() => [props.beacons, props.testPoints, props.truePositions], () => {
  nextTick(() => {
    calculateOptimalView()
    simpleDraw()
  })
}, { deep: true })

watch(() => [props.selectedAlgorithm, props.visualizationMode], () => {
  nextTick(() => {
    simpleDraw()
  })
})

function resizeCanvas() {
  if (!containerRef.value || !canvasRef.value)
    return

  const container = containerRef.value
  canvasRef.value.width = container.clientWidth
  canvasRef.value.height = container.clientHeight

  calculateOptimalView()
  simpleDraw()
}
</script>

<template>
  <div ref="containerRef" class="rounded-lg bg-white w-full relative overflow-hidden" style="height: 400px;">
    <canvas
      ref="canvasRef"
      class="cursor-crosshair inset-0 absolute"
      @mousemove="handleMouseMove"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @click="handleClick"
      @wheel="handleWheel"
      @contextmenu.prevent="() => {}"
      @mouseleave="() => { hoveredObject = null; isDragging = false; isPanning = false }"
    />

    <!-- 画布控制面板 -->
    <div class="p-3 rounded-lg bg-white bg-opacity-90 shadow-lg left-4 top-4 absolute space-y-2">
      <div class="text-sm text-gray-700 font-medium">
        可视化模式
      </div>
      <div class="text-xs text-gray-600">
        当前: {{ visualizationMode === 'overlay' ? '叠加'
          : visualizationMode === 'comparison' ? '对比'
            : visualizationMode === 'accuracy' ? '精度' : '热力图' }}
      </div>
      <div class="text-xs text-gray-600">
        算法: {{ selectedAlgorithm }}
      </div>
      <div class="text-xs text-gray-600">
        缩放: {{ Math.round(scale / 50 * 100) }}%
      </div>
    </div>

    <!-- 图例 -->
    <div class="p-3 rounded-lg bg-white bg-opacity-90 shadow-lg bottom-4 right-4 absolute space-y-2">
      <div class="text-sm text-gray-700 font-medium">
        图例
      </div>
      <div class="text-xs space-y-1">
        <div class="flex items-center space-x-2">
          <div class="rounded-full h-3 w-3" :style="{ backgroundColor: colors.beacon }" />
          <span>蓝牙信标</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="rounded-full h-3 w-3" :style="{ backgroundColor: colors.truePosition }" />
          <span>真实位置</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="rounded-full h-3 w-3" :style="{ backgroundColor: colors.algorithm[selectedAlgorithm as keyof typeof colors.algorithm] }" />
          <span>{{ selectedAlgorithm }}结果</span>
        </div>
      </div>
    </div>

    <!-- 鼠标坐标显示 -->
    <div class="text-xs text-gray-600 p-2 rounded-lg bg-white bg-opacity-90 shadow-lg right-4 top-4 absolute">
      坐标: ({{ screenToWorld(mousePosition.x, mousePosition.y).x.toFixed(1) }}, {{ screenToWorld(mousePosition.x, mousePosition.y).y.toFixed(1) }})
    </div>
  </div>
</template>
