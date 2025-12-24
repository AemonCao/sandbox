import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * Conway生命游戏核心逻辑
 */
export function useConwayGame() {
  const canvasRef = ref<HTMLCanvasElement>()
  const containerRef = ref<HTMLElement>()

  const generation = ref(0)
  const population = ref(0)
  const isPlaying = ref(false)
  const fps = ref(30)
  const resolution = ref(20)

  let ctx: CanvasRenderingContext2D | null = null
  let animationId: number | null = null
  let cols = 0
  let rows = 0
  let grid: number[][] = []
  let nextGrid: number[][] = []
  let then = Date.now()
  let isMouseDown = false
  let drawMode = 1

  const isDark = useDark()
  const cellColor = computed(() => isDark.value ? '#00ff88' : '#3b82f6')

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
    if (!canvasRef.value || !containerRef.value)
      return

    const canvas = canvasRef.value
    canvas.width = containerRef.value.clientWidth
    canvas.height = containerRef.value.clientHeight
    cols = Math.floor(canvas.width / resolution.value)
    rows = Math.floor(canvas.height / resolution.value)
  }

  /**
   * 重置网格
   */
  function resetGrid() {
    grid = create2DArray(cols, rows)
    nextGrid = create2DArray(cols, rows)
    generation.value = 0
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
    generation.value++
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

    ctx.fillStyle = cellColor.value

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (grid[i][j] === 1) {
          ctx.fillRect(
            i * resolution.value,
            j * resolution.value,
            resolution.value - 1,
            resolution.value - 1,
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
    population.value = pop
  }

  /**
   * 动画循环
   */
  function loop() {
    if (!isPlaying.value)
      return

    animationId = requestAnimationFrame(loop)

    const now = Date.now()
    const delta = now - then
    const interval = 1000 / fps.value

    if (delta > interval) {
      then = now - (delta % interval)
      computeNextGen()
      draw()
    }
  }

  /**
   * 鼠标交互
   */
  function handleMouse(e: MouseEvent) {
    if (!canvasRef.value)
      return

    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const i = Math.floor(mouseX / resolution.value)
    const j = Math.floor(mouseY / resolution.value)

    if (i >= 0 && i < cols && j >= 0 && j < rows) {
      if (e.type === 'mousedown') {
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
    isPlaying.value = !isPlaying.value
    if (isPlaying.value) {
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
    if (isPlaying.value) {
      isPlaying.value = false
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
    generation.value = 0
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
   * 初始化
   */
  function setup() {
    if (!canvasRef.value)
      return

    ctx = canvasRef.value.getContext('2d')
    resizeCanvas()
    resetGrid()
    randomize()
    draw()

    // 鼠标事件
    canvasRef.value.addEventListener('mousedown', (e) => {
      isMouseDown = true
      handleMouse(e)
    })
    canvasRef.value.addEventListener('mousemove', (e) => {
      if (isMouseDown)
        handleMouse(e)
    })
    window.addEventListener('mouseup', () => {
      isMouseDown = false
    })

    // 窗口大小变化
    window.addEventListener('resize', () => {
      resizeCanvas()
      resetGrid()
      draw()
    })
  }

  // 监听分辨率变化
  watch(resolution, () => {
    resizeCanvas()
    resetGrid()
    randomize()
    draw()
  })

  // 监听主题变化，重新绘制
  watch(cellColor, () => {
    draw()
  })

  onMounted(() => {
    setup()
  })

  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })

  return {
    canvasRef,
    containerRef,
    generation,
    population,
    isPlaying,
    fps,
    resolution,
    togglePlay,
    step,
    randomize,
    clear,
  }
}
