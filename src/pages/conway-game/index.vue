<script setup lang="ts">
import GUI from 'lil-gui'

const isDark = useDark()
const canvasRef = ref<HTMLCanvasElement>()

let ctx: CanvasRenderingContext2D
let animationId: number
let gui: GUI | null = null
let cols = 0
let rows = 0
let grid: number[][] = []
let nextGrid: number[][] = []
let then = Date.now()
let isMouseDown = false
let drawMode = 1

const params = reactive({
  generation: 0,
  population: 0,
  isPlaying: false,
  fps: 30,
  resolution: 20,
  cellColor: computed(() => isDark.value ? '#00ff88' : '#3b82f6'),
})

/**
 * 创建二维数组
 */
function create2DArray(c: number, r: number): number[][] {
  return Array.from({ length: c }, () => Array.from({ length: r }, () => 0))
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
  if (!canvasRef.value)
    return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
  cols = Math.floor(canvasRef.value.width / params.resolution)
  rows = Math.floor(canvasRef.value.height / params.resolution)
}

/**
 * 重置网格
 */
function resetGrid() {
  grid = create2DArray(cols, rows)
  nextGrid = create2DArray(cols, rows)
  params.generation = 0
  updateStats()
}

/**
 * 计算邻居数量
 */
function countNeighbors(x: number, y: number): number {
  let sum = 0
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      const col = (x + i + cols) % cols
      const row = (y + j + rows) % rows
      sum += grid[col][row]
    }
  }
  sum -= grid[x][y]
  return sum
}

/**
 * 计算下一代
 */
function computeNextGen() {
  let pop = 0
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const state = grid[i][j]
      const neighbors = countNeighbors(i, j)

      if (state === 0 && neighbors === 3) {
        nextGrid[i][j] = 1
      }
      else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[i][j] = 0
      }
      else {
        nextGrid[i][j] = state
      }

      if (nextGrid[i][j] === 1)
        pop++
    }
  }

  [grid, nextGrid] = [nextGrid, grid]
  params.generation++
  updateStats(pop)
}

/**
 * 绘制画布
 */
function draw() {
  if (!ctx || !canvasRef.value)
    return

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.fillStyle = params.cellColor

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) {
        ctx.fillRect(
          i * params.resolution,
          j * params.resolution,
          params.resolution - 1,
          params.resolution - 1,
        )
      }
    }
  }
}

/**
 * 更新统计信息
 */
function updateStats(pop?: number) {
  if (pop === undefined) {
    pop = 0
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        pop += grid[i][j]
      }
    }
  }
  params.population = pop
}

/**
 * 动画循环
 */
function loop() {
  if (!params.isPlaying)
    return

  animationId = requestAnimationFrame(loop)

  const now = Date.now()
  const delta = now - then
  const interval = 1000 / params.fps

  if (delta > interval) {
    then = now - (delta % interval)
    computeNextGen()
    draw()
  }
}

/**
 * 鼠标/触摸交互
 */
function handlePointer(x: number, y: number, isStart: boolean) {
  if (!canvasRef.value)
    return

  const i = Math.floor(x / params.resolution)
  const j = Math.floor(y / params.resolution)

  if (i >= 0 && i < cols && j >= 0 && j < rows) {
    if (isStart) {
      drawMode = grid[i][j] ? 0 : 1
    }
    grid[i][j] = drawMode
    draw()
    updateStats()
  }
}

/**
 * 切换播放状态
 */
function togglePlay() {
  params.isPlaying = !params.isPlaying
  if (params.isPlaying) {
    then = Date.now()
    loop()
  }
  else if (animationId) {
    cancelAnimationFrame(animationId)
  }
}

/**
 * 单步执行
 */
function step() {
  if (params.isPlaying) {
    params.isPlaying = false
    if (animationId)
      cancelAnimationFrame(animationId)
  }
  computeNextGen()
  draw()
}

/**
 * 随机生成
 */
function randomize() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = Math.random() > 0.85 ? 1 : 0
    }
  }
  params.generation = 0
  updateStats()
  draw()
}

/**
 * 清空画布
 */
function clear() {
  resetGrid()
  draw()
}

/**
 * 初始化 GUI
 */
function initGUI() {
  gui = new GUI()
  gui.domElement.style.position = 'fixed'
  gui.domElement.style.top = '85px'
  gui.domElement.style.right = '20px'

  const fInfo = gui.addFolder('信息')
  fInfo.add(params, 'generation').name('代数').disable().listen()
  fInfo.add(params, 'population').name('存活').disable().listen()

  const fControl = gui.addFolder('控制')
  fControl.add({ togglePlay }, 'togglePlay').name('播放/暂停')
  fControl.add({ step }, 'step').name('步进')
  fControl.add({ randomize }, 'randomize').name('随机')
  fControl.add({ clear }, 'clear').name('清空')

  const fSettings = gui.addFolder('设置')
  fSettings.add(params, 'fps', 1, 60, 1).name('速度')
  fSettings.add(params, 'resolution', 5, 50, 1).name('大小').onChange(() => {
    resizeCanvas()
    resetGrid()
    randomize()
  })
  fSettings.addColor(params, 'cellColor').name('颜色')

  watch(isDark, () => {
    if (gui) {
      gui.domElement.classList.toggle('dark', isDark.value)
    }
  })
}

onMounted(() => {
  if (!canvasRef.value)
    return

  ctx = canvasRef.value.getContext('2d')!
  resizeCanvas()
  resetGrid()
  randomize()

  initGUI()

  canvasRef.value.addEventListener('mousedown', (e) => {
    isMouseDown = true
    handlePointer(e.clientX, e.clientY, true)
  })
  canvasRef.value.addEventListener('mousemove', (e) => {
    if (isMouseDown)
      handlePointer(e.clientX, e.clientY, false)
  })
  window.addEventListener('mouseup', () => {
    isMouseDown = false
  })

  canvasRef.value.addEventListener('touchstart', (e) => {
    e.preventDefault()
    isMouseDown = true
    const touch = e.touches[0]
    handlePointer(touch.clientX, touch.clientY, true)
  })
  canvasRef.value.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (isMouseDown) {
      const touch = e.touches[0]
      handlePointer(touch.clientX, touch.clientY, false)
    }
  })
  canvasRef.value.addEventListener('touchend', (e) => {
    e.preventDefault()
    isMouseDown = false
  })

  window.addEventListener('resize', () => {
    resizeCanvas()
    resetGrid()
    draw()
  })

  watch(() => params.cellColor, draw)
})

onUnmounted(() => {
  if (animationId)
    cancelAnimationFrame(animationId)
  if (gui)
    gui.destroy()
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
  title: 'Conway生命游戏'
  description: 'Conway生命游戏模拟器，支持交互式绘制和自动演化'
  tags: ['算法', '模拟', 'Canvas']
</route>
