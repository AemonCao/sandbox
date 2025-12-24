<script setup lang="ts">
import type { PathfindingParams } from './composables/types'
import { NodeState, NodeType } from './composables/types'
import { useAlgorithms } from './composables/useAlgorithms'
import { useAnimation } from './composables/useAnimation'
import { useGrid } from './composables/useGrid'
import { useGUI } from './composables/useGUI'

const isDark = useDark()
const canvasRef = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D

const params = reactive<PathfindingParams>({
  algorithm: 'astar',
  gridSize: 25,
  animationSpeed: 60,
  isPlaying: false,
  allowDiagonal: false,
  wallDensity: 0.3,
})

const { grid, cols, rows, startNode, endNode, initGrid, resetGridState, clearGrid, generateRandomWalls, generateMaze } = useGrid(canvasRef, params)
const { runAlgorithm } = useAlgorithms()
const { stats, loadFrames, play, pause, reset, skipToEnd } = useAnimation(params)

/**
 * 绘制网格
 */
function drawGrid() {
  if (!canvasRef.value || !ctx)
    return

  const canvas = canvasRef.value
  const gridData = grid()
  const colsCount = cols()
  const rowsCount = rows()

  // 背景
  ctx.fillStyle = isDark.value ? '#111' : '#f5f5f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格线
  ctx.strokeStyle = isDark.value ? '#333' : '#ddd'
  ctx.lineWidth = 1

  for (let x = 0; x <= colsCount; x++) {
    ctx.beginPath()
    ctx.moveTo(x * params.gridSize, 0)
    ctx.lineTo(x * params.gridSize, canvas.height)
    ctx.stroke()
  }

  for (let y = 0; y <= rowsCount; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * params.gridSize)
    ctx.lineTo(canvas.width, y * params.gridSize)
    ctx.stroke()
  }

  // 绘制节点
  for (let x = 0; x < colsCount; x++) {
    for (let y = 0; y < rowsCount; y++) {
      const node = gridData[x][y]
      const px = x * params.gridSize
      const py = y * params.gridSize

      // 根据节点类型和状态选择颜色
      if (node.type === NodeType.WALL) {
        ctx.fillStyle = isDark.value ? '#555' : '#333'
      }
      else if (node.type === NodeType.START) {
        ctx.fillStyle = '#22c55e' // 绿色起点
      }
      else if (node.type === NodeType.END) {
        ctx.fillStyle = '#ef4444' // 红色终点
      }
      else if (node.state === NodeState.PATH) {
        ctx.fillStyle = '#fbbf24' // 黄色路径
      }
      else if (node.state === NodeState.VISITED) {
        ctx.fillStyle = isDark.value ? '#1e40af' : '#93c5fd' // 蓝色已访问
      }
      else if (node.state === NodeState.VISITING) {
        ctx.fillStyle = isDark.value ? '#15803d' : '#86efac' // 绿色正在访问
      }
      else {
        continue // 空节点不绘制
      }

      ctx.fillRect(px + 1, py + 1, params.gridSize - 2, params.gridSize - 2)
    }
  }
}

/**
 * 运行路径寻找算法
 */
function runPathfinding() {
  resetGridState()
  const start = performance.now()
  const frames = runAlgorithm(params.algorithm, grid(), startNode(), endNode(), params.allowDiagonal)
  stats.duration = Math.round(performance.now() - start)
  loadFrames(frames)
  play(
    (frame) => {
      frame.node.state = frame.type === 'visit' ? NodeState.VISITED : NodeState.PATH
      drawGrid()
    },
    () => {},
  )
}

const actions = {
  runAlgorithm: runPathfinding,
  pause,
  reset: () => {
    reset()
    resetGridState()
    drawGrid()
  },
  clear: () => {
    clearGrid()
    drawGrid()
  },
  randomWalls: () => {
    generateRandomWalls()
    drawGrid()
  },
  generateMaze: () => {
    generateMaze()
    drawGrid()
  },
  skipToEnd: () => {
    skipToEnd((frame) => {
      frame.node.state = frame.type === 'visit' ? NodeState.VISITED : NodeState.PATH
      drawGrid()
    })
  },
}

const { initGUI, destroyGUI } = useGUI(params, actions, stats, isDark)

/**
 * 调整 Canvas 大小
 */
function resizeCanvas() {
  if (!canvasRef.value)
    return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
  initGrid()
  drawGrid()
}

// 鼠标/触摸绘制
let isDrawing = false
let drawType: NodeType = NodeType.WALL

/**
 * 处理指针事件
 */
function handlePointer(clientX: number, clientY: number, isStart: boolean) {
  if (!canvasRef.value)
    return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = Math.floor((clientX - rect.left) / params.gridSize)
  const y = Math.floor((clientY - rect.top) / params.gridSize)

  if (x < 0 || x >= cols() || y < 0 || y >= rows())
    return

  const node = grid()[x][y]

  if (isStart) {
    // 确定绘制类型
    if (node.type === NodeType.WALL) {
      drawType = NodeType.EMPTY // 擦除墙壁
    }
    else if (node.type === NodeType.EMPTY) {
      drawType = NodeType.WALL // 绘制墙壁
    }
    else {
      return // 不能修改起点/终点
    }
  }

  // 只能修改空节点和墙壁
  if (node.type === NodeType.EMPTY || node.type === NodeType.WALL) {
    node.type = drawType
    drawGrid()
  }
}

onMounted(() => {
  if (!canvasRef.value)
    return

  ctx = canvasRef.value.getContext('2d')!
  resizeCanvas()
  generateRandomWalls()
  drawGrid()
  initGUI()

  window.addEventListener('resize', resizeCanvas)

  // 鼠标事件
  canvasRef.value.addEventListener('mousedown', (e) => {
    isDrawing = true
    handlePointer(e.clientX, e.clientY, true)
  })
  canvasRef.value.addEventListener('mousemove', (e) => {
    if (isDrawing)
      handlePointer(e.clientX, e.clientY, false)
  })
  window.addEventListener('mouseup', () => {
    isDrawing = false
  })

  // 触摸事件
  canvasRef.value.addEventListener('touchstart', (e) => {
    e.preventDefault()
    isDrawing = true
    const touch = e.touches[0]
    handlePointer(touch.clientX, touch.clientY, true)
  })
  canvasRef.value.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (isDrawing) {
      const touch = e.touches[0]
      handlePointer(touch.clientX, touch.clientY, false)
    }
  })
  canvasRef.value.addEventListener('touchend', (e) => {
    e.preventDefault()
    isDrawing = false
  })
})

onUnmounted(() => {
  destroyGUI()
  window.removeEventListener('resize', resizeCanvas)
})

// 监听主题变化，自动重绘
watch(isDark, () => {
  drawGrid()
})
</script>

<template>
  <canvas ref="canvasRef" inset-0 fixed />
</template>

<style scoped>
canvas {
  display: block;
  cursor: crosshair;
}
</style>

<route lang="yaml">
meta:
  layout: default
  title: '路径寻找可视化'
  description: '可视化展示 A*、Dijkstra、BFS、DFS 四种路径寻找算法的搜索过程'
  tags: ['算法', 'Canvas', '可视化', '路径寻找']
</route>
