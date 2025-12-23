/**
 * 折线图渲染器
 */
import type { ChartConfig, GridStyle, LineChartData } from '../types'

/**
 * 获取网格字符
 */
function getGridChars(style: GridStyle = 'thin-medium'): { horizontal: string, vertical: string, cross: string, isThick: boolean } {
  const gridChars: Record<GridStyle, { horizontal: string, vertical: string, cross: string, isThick: boolean }> = {
    'thin-medium': { horizontal: '┄', vertical: '┆', cross: '┼', isThick: false },
    'thick-medium': { horizontal: '┅', vertical: '┇', cross: '╋', isThick: true },
    'thin-dense': { horizontal: '┈', vertical: '┊', cross: '┼', isThick: false },
    'thick-dense': { horizontal: '┉', vertical: '┋', cross: '╋', isThick: true },
    'thin-solid': { horizontal: '─', vertical: '│', cross: '┼', isThick: false },
    'thick-solid': { horizontal: '━', vertical: '┃', cross: '╋', isThick: true },
  }
  return gridChars[style]
}

/**
 * 包装字符串为带颜色的 HTML span 标签
 */
function colorize(text: string, colorVar?: string): string {
  if (!colorVar)
    return text
  return `<span style="color:var(--chart-${colorVar}-color)">${text}</span>`
}

/**
 * 渲染折线图
 */
export function renderLineChart(config: ChartConfig): string[] {
  const data = config.data as LineChartData
  const { width, height, showAxis, showGrid, showHorizontalGrid, showVerticalGrid } = config.style

  // 动态计算网格数量，优先使用更多网格线
  const availableHeight = height - 2
  const gridCount = Math.min(5, Math.max(2, Math.floor(availableHeight / 4)))

  // 创建画布
  const canvas: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ' '))

  // 计算数据范围
  const allY = data.series.flatMap(s => s.data.map(d => d.y))
  if (allY.length === 0)
    return canvas.map(row => row.join(''))

  const yMin = Math.min(...allY)
  const yMax = Math.max(...allY)
  const yRange = yMax - yMin || 1

  // 创建Y轴缩放函数
  const yScale = (y: number) =>
    height - 2 - Math.round(((y - yMin) / yRange) * (height - 3))

  // 绘制坐标轴
  if (showAxis) {
    for (let y = 0; y < height; y++)
      canvas[y][0] = colorize('│', 'axis')
    for (let x = 0; x < width; x++)
      canvas[height - 1][x] = colorize('─', 'axis')
    canvas[height - 1][0] = colorize('└', 'axis')
  }

  // 绘制网格
  if (showGrid) {
    const gridChars = getGridChars(config.style.gridStyle)
    // 横向网格线（从下到上均匀分布）
    if (showHorizontalGrid) {
      const step = Math.floor(availableHeight / gridCount)
      for (let i = 1; i <= gridCount; i++) {
        const y = height - 1 - i * step
        if (y > 0) {
          for (let x = 1; x < width; x++) {
            if (canvas[y][x] === ' ')
              canvas[y][x] = colorize(gridChars.horizontal, 'grid')
          }
        }
      }
    }
    // 纵向网格线（从左到右均匀分布）
    if (showVerticalGrid) {
      const availableWidth = width - 1
      const verticalGridCount = Math.min(5, Math.max(2, Math.floor(availableWidth / 8)))
      const stepX = Math.floor(availableWidth / verticalGridCount)
      for (let i = 1; i <= verticalGridCount; i++) {
        const x = i * stepX
        if (x > 0 && x < width) {
          for (let y = 1; y < height - 1; y++) {
            if (canvas[y][x] === ' ')
              canvas[y][x] = colorize(gridChars.vertical, 'grid')
            else if (canvas[y][x].includes(gridChars.horizontal))
              canvas[y][x] = colorize(gridChars.cross, 'grid')
          }
        }
      }
    }
  }

  // 绘制折线
  data.series.forEach((series) => {
    if (series.data.length === 0)
      return

    const points = series.data.map((d, i) => ({
      x: Math.round((i / (series.data.length - 1)) * (width - 5)) + 2,
      y: yScale(d.y),
    }))

    // 连接线段
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      drawLine(canvas, p1.x, p1.y, p2.x, p2.y, 'line')
    }

    // 绘制数据点（最后绘制，确保在最上层）
    points.forEach(({ x, y }) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        canvas[y][x] = colorize(series.symbol || '●', 'point')
      }
    })
  })

  return canvas.map(row => row.join(''))
}

/**
 * 使用 Bresenham 算法绘制线段
 */
function drawLine(
  canvas: string[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color?: string,
): void {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  let x = x0
  let y = y0
  let prevY = y0

  while (true) {
    if (x === x1 && y === y1)
      break

    const e2 = 2 * err
    const moveX = e2 > -dy
    const moveY = e2 < dx

    // 根据实际移动方向选择字符
    let char = ' '
    if (moveX && moveY) {
      char = sy > 0 ? '╲' : '╱'
    }
    else if (moveX) {
      // 根据前后Y坐标变化选择横线高度
      const nextY = moveY ? y + sy : y
      if (prevY < y && nextY > y) {
        char = '▔' // 上升后下降 - 顶部
      }
      else if (prevY > y && nextY < y) {
        char = '▁' // 下降后上升 - 底部
      }
      else if (prevY < y || nextY > y) {
        char = '▔' // 偏上
      }
      else if (prevY > y || nextY < y) {
        char = '▁' // 偏下
      }
      else {
        char = '─' // 水平
      }
    }
    else if (moveY) {
      // 根据前后X坐标变化选择竖线位置
      const nextX = moveX ? x + sx : x
      const prevX = x - sx
      if (prevX < x || nextX > x) {
        char = '▏' // 偏左
      }
      else if (prevX > x || nextX < x) {
        char = '▕' // 偏右
      }
      else {
        char = '│' // 中间
      }
    }

    if (canvas[y]?.[x] !== undefined) {
      canvas[y][x] = colorize(char, color)
    }

    prevY = y
    if (moveX) {
      err -= dy
      x += sx
    }
    if (moveY) {
      err += dx
      y += sy
    }
  }
}
