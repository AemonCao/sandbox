/**
 * 柱状图渲染器
 */
import type { BarChartData, BarStyle, ChartConfig, GridStyle } from '../types'
import { addBorder } from './borderUtils'

/**
 * 获取网格字符
 */
function getGridChars(style: GridStyle = 'thin-medium'): { horizontal: string } {
  const gridChars: Record<GridStyle, { horizontal: string }> = {
    'thin-medium': { horizontal: '┄' },
    'thick-medium': { horizontal: '┅' },
    'thin-dense': { horizontal: '┈' },
    'thick-dense': { horizontal: '┉' },
    'thin-solid': { horizontal: '─' },
    'thick-solid': { horizontal: '━' },
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
 * 获取柱状图样式字符
 */
function getBarChars(style: BarStyle = 'solid'): { fill: string, top: string, side: string, topLeft: string, topRight: string, hollow: boolean } {
  switch (style) {
    case 'solid':
      return { fill: '█', top: '█', side: '█', topLeft: '█', topRight: '█', hollow: false }
    case 'shadow':
      return { fill: '░', top: '░', side: '░', topLeft: '░', topRight: '░', hollow: false }
    case 'hollow':
      return { fill: ' ', top: '─', side: '│', topLeft: '┌', topRight: '┐', hollow: true }
    case 'bold-hollow':
      return { fill: ' ', top: '━', side: '┃', topLeft: '┏', topRight: '┓', hollow: true }
    case 'double-line':
      return { fill: ' ', top: '═', side: '║', topLeft: '╔', topRight: '╗', hollow: true }
    case 'rounded':
      return { fill: ' ', top: '─', side: '│', topLeft: '╭', topRight: '╮', hollow: true }
    default:
      return { fill: '█', top: '█', side: '█', topLeft: '█', topRight: '█', hollow: false }
  }
}

/**
 * 渲染柱状图
 */
export function renderBarChart(config: ChartConfig): string[] {
  const data = config.data as BarChartData
  const { width, height, showAxis, showGrid, showHorizontalGrid } = config.style

  // 动态计算网格数量，优先使用更多网格线
  const availableHeight = height - 2
  const gridCount = Math.min(5, Math.max(2, Math.floor(availableHeight / 4)))

  const canvas: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ' '))

  if (data.values.length === 0)
    return canvas.map(row => row.join(''))

  // 计算最大值
  const maxValue = Math.max(...data.values)
  if (maxValue === 0)
    return canvas.map(row => row.join(''))

  const yScale = (value: number) =>
    Math.round((value / maxValue) * (height - 3))

  // 绘制坐标轴
  if (showAxis) {
    for (let y = 0; y < height; y++)
      canvas[y][0] = colorize('│', 'axis')
    for (let x = 0; x < width; x++)
      canvas[height - 1][x] = colorize('─', 'axis')
    canvas[height - 1][0] = colorize('└', 'axis')
  }

  // 绘制横向网格线（从下到上均匀分布）
  if (showGrid && showHorizontalGrid) {
    const gridChars = getGridChars(config.style.gridStyle)
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

  // 计算柱子宽度和间距
  const barCount = data.values.length
  const availableWidth = width - 2
  const totalUnits = barCount * 2 + (barCount - 1) // 每个柱子2单位宽度 + 间距
  const unitWidth = Math.floor(availableWidth / totalUnits)
  const barWidth = Math.max(2, unitWidth * 2)
  const spacing = Math.max(1, unitWidth)

  // 计算实际使用的宽度和剩余空间
  const usedWidth = barCount * barWidth + (barCount - 1) * spacing
  const leftPadding = Math.floor((availableWidth - usedWidth) / 2)

  // 获取柱子样式字符
  const barChars = getBarChars(data.barStyle)

  // 绘制柱子
  let currentX = 2 + leftPadding
  data.values.forEach((value, index) => {
    const barHeight = yScale(value)

    // 绘制柱子
    for (let h = 0; h < barHeight; h++) {
      const y = height - 2 - h
      for (let w = 0; w < barWidth; w++) {
        const x = currentX + w
        if (x < width && y >= 0) {
          let char = barChars.fill

          // 顶部角落处理（空心和实心都适用）
          if (h === barHeight - 1) {
            if (w === 0) {
              char = barChars.topLeft
            }
            else if (w === barWidth - 1) {
              char = barChars.topRight
            }
            else if (barChars.hollow) {
              char = barChars.top
            }
          }
          // 空心样式：侧边绘制
          else if (barChars.hollow && (w === 0 || w === barWidth - 1)) {
            char = barChars.side
          }

          canvas[y][x] = colorize(char, 'bar')
        }
      }
    }

    // 绘制类别标签（如果有）- 居中对齐
    if (data.categories[index]) {
      const label = data.categories[index].slice(0, barWidth)
      const labelStartX = currentX + Math.floor((barWidth - label.length) / 2)
      for (let i = 0; i < label.length && labelStartX + i < width; i++) {
        canvas[height - 1][labelStartX + i] = label[i]
      }
    }

    currentX += barWidth + spacing
  })

  const result = canvas.map(row => row.join(''))

  // 添加边框
  if (config.style.showBorder) {
    return addBorder(result, width, height, config.style.borderStyle)
  }

  return result
}
