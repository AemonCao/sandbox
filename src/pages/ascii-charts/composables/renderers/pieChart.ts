/**
 * 饼图渲染器
 */
import type { ChartConfig, PieChartData } from '../types'
import { addBorder } from './borderUtils'

const lightColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']
const darkColors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#2dd4bf']
const chars = ['█', '▓', '▒', '░', '▪', '▫', '◆', '●', '■', '▲']

/**
 * 渲染饼图
 */
export function renderPieChart(config: ChartConfig): string[] {
  const data = config.data as PieChartData
  const { width, height } = config.style
  const lines: string[] = []

  const isDark = document.documentElement.classList.contains('dark')
  const colors = isDark ? darkColors : lightColors
  const labelStyle = data.labelStyle || 'none'
  const legendPosition = data.legendPosition || 'bottom'
  const legendOrientation = data.legendOrientation || 'vertical'

  const total = data.slices.reduce((sum, slice) => sum + slice.value, 0)

  // 生成图例
  const legendItems = data.slices.map((slice, index) => {
    const percentage = ((slice.value / total) * 100).toFixed(1)
    const color = slice.color || colors[index % colors.length]
    const char = chars[index % chars.length]
    return `<span style="color: ${color}">${char}</span> ${slice.label}: ${slice.value} (${percentage}%)`
  })
  const maxLegendWidth = Math.max(...legendItems.map(item => item.replace(/<[^>]*>/g, '').length))

  // 根据图例位置计算画布尺寸
  let canvasWidth = width
  let canvasHeight = height
  if (legendPosition === 'left' || legendPosition === 'right') {
    if (legendOrientation === 'vertical') {
      canvasWidth = width - maxLegendWidth - 2
    }
  }
  else if (legendPosition === 'top' || legendPosition === 'bottom') {
    if (legendOrientation === 'vertical') {
      canvasHeight = height - legendItems.length - 1
    }
    else {
      canvasHeight = height - 2
    }
  }

  // line 模式需要额外空间用于标签
  const labelSpace = labelStyle === 'line' ? 6 : 0
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  // 字符长宽比约为 0.5，所以宽度需要除以 2 来匹配高度
  const radius = Math.min(canvasWidth / 2 / 0.52, canvasHeight / 2) - labelSpace - 2

  // 创建空白画布
  const canvas = Array.from({ length: canvasHeight }, () =>
    Array.from({ length: canvasWidth }, () => ({ char: ' ', color: '' })))

  // 存储每个扇区的中心点和角度
  const sliceInfo: Array<{ centerX: number, centerY: number, angle: number, percentage: number }> = []

  // 绘制圆形饼图
  let startAngle = -Math.PI / 2 // 从顶部开始
  data.slices.forEach((slice, index) => {
    const percentage = slice.value / total
    const endAngle = startAngle + percentage * 2 * Math.PI
    const char = chars[index % chars.length]
    const color = slice.color || colors[index % colors.length]
    const midAngle = (startAngle + endAngle) / 2

    // 计算扇区中心点（用于标签）
    const labelRadius = radius * 0.6
    const labelX = centerX + Math.cos(midAngle) / 0.52 * labelRadius
    const labelY = centerY + Math.sin(midAngle) * labelRadius

    sliceInfo.push({ centerX: labelX, centerY: labelY, angle: midAngle, percentage: percentage * 100 })

    // 填充扇形区域
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const dx = (x - centerX) * 0.52
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= radius) {
          const angle = Math.atan2(dy, dx)
          const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI)
          const normalizedStart = (startAngle + 2 * Math.PI) % (2 * Math.PI)
          const normalizedEnd = (endAngle + 2 * Math.PI) % (2 * Math.PI)

          let inSlice = false
          if (normalizedStart < normalizedEnd) {
            inSlice = normalizedAngle >= normalizedStart && normalizedAngle < normalizedEnd
          }
          else {
            inSlice = normalizedAngle >= normalizedStart || normalizedAngle < normalizedEnd
          }

          if (inSlice) {
            canvas[y][x] = { char, color }
          }
        }
      }
    }

    startAngle = endAngle
  })

  // 绘制标签
  if (labelStyle === 'center') {
    data.slices.forEach((slice, index) => {
      const info = sliceInfo[index]
      const label = `${slice.label} ${info.percentage.toFixed(0)}%`
      const labelX = Math.round(info.centerX)
      const labelY = Math.round(info.centerY)
      const labelColor = slice.color || colors[index % colors.length]

      // 将标签写入画布
      for (let i = 0; i < label.length; i++) {
        const x = labelX - Math.floor(label.length / 2) + i
        if (x >= 0 && x < canvasWidth && labelY >= 0 && labelY < canvasHeight) {
          canvas[labelY][x] = { char: label[i], color: labelColor }
        }
      }
    })
  }
  else if (labelStyle === 'line') {
    data.slices.forEach((slice, index) => {
      const info = sliceInfo[index]
      const color = slice.color || colors[index % colors.length]
      const outerRadius = radius + 3
      const lineEndX = centerX + Math.cos(info.angle) / 0.52 * outerRadius
      const lineEndY = centerY + Math.sin(info.angle) * outerRadius

      // 绘制指示线
      const steps = 5
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = Math.round(info.centerX + (lineEndX - info.centerX) * t)
        const y = Math.round(info.centerY + (lineEndY - info.centerY) * t)
        if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
          canvas[y][x] = { char: '·', color }
        }
      }

      // 绘制标签
      const label = `${slice.label} ${info.percentage.toFixed(0)}%`
      const labelX = Math.round(lineEndX) + (Math.cos(info.angle) > 0 ? 1 : -label.length)
      const labelY = Math.round(lineEndY)
      if (labelY >= 0 && labelY < canvasHeight) {
        for (let i = 0; i < label.length; i++) {
          const x = labelX + i
          if (x >= 0 && x < canvasWidth) {
            canvas[labelY][x] = { char: label[i], color }
          }
        }
      }
    })
  }

  // 转换为带颜色的字符串
  const chartLines: string[] = []
  canvas.forEach((row) => {
    let line = ''
    row.forEach((cell) => {
      if (cell.color) {
        line += `<span style="color: ${cell.color}">${cell.char}</span>`
      }
      else {
        line += cell.char
      }
    })
    chartLines.push(line)
  })

  /**
   * 将图例项按宽度换行并对齐
   */
  function wrapLegendItems(items: string[], maxWidth: number): string[] {
    const wrappedLines: string[] = []
    const lineItems: string[][] = []
    let currentLineItems: string[] = []
    let currentLineWidth = 0

    items.forEach((item) => {
      const itemWidth = item.replace(/<[^>]*>/g, '').length
      const separator = currentLineItems.length > 0 ? 2 : 0

      if (currentLineWidth + separator + itemWidth > maxWidth && currentLineItems.length > 0) {
        lineItems.push(currentLineItems)
        currentLineItems = [item]
        currentLineWidth = itemWidth
      }
      else {
        currentLineItems.push(item)
        currentLineWidth += separator + itemWidth
      }
    })

    if (currentLineItems.length > 0) {
      lineItems.push(currentLineItems)
    }

    lineItems.forEach((items) => {
      wrappedLines.push(items.join('  '))
    })

    return wrappedLines
  }

  // 根据位置和方向组合图例和图表
  if (legendPosition === 'top') {
    if (legendOrientation === 'horizontal') {
      lines.push(...wrapLegendItems(legendItems, width))
      lines.push('')
    }
    else {
      legendItems.forEach(item => lines.push(item))
      lines.push('')
    }
    lines.push(...chartLines)
  }
  else if (legendPosition === 'bottom') {
    lines.push(...chartLines)
    lines.push('')
    if (legendOrientation === 'horizontal') {
      lines.push(...wrapLegendItems(legendItems, width))
    }
    else {
      legendItems.forEach(item => lines.push(item))
    }
  }
  else if (legendPosition === 'left') {
    if (legendOrientation === 'horizontal') {
      lines.push(...wrapLegendItems(legendItems, width))
      lines.push('')
      lines.push(...chartLines)
    }
    else {
      for (let i = 0; i < Math.max(legendItems.length, chartLines.length); i++) {
        const legend = legendItems[i] || ''
        const chart = chartLines[i] || ''
        const padding = ' '.repeat(Math.max(0, maxLegendWidth - (legend.replace(/<[^>]*>/g, '').length)))
        lines.push(`${legend}${padding}  ${chart}`)
      }
    }
  }
  else if (legendPosition === 'right') {
    if (legendOrientation === 'horizontal') {
      lines.push(...chartLines)
      lines.push('')
      lines.push(...wrapLegendItems(legendItems, width))
    }
    else {
      for (let i = 0; i < Math.max(legendItems.length, chartLines.length); i++) {
        const chart = chartLines[i] || ' '.repeat(canvasWidth)
        const legend = legendItems[i] || ''
        lines.push(`${chart}  ${legend}`)
      }
    }
  }

  // 添加边框
  if (config.style.showBorder) {
    // 计算实际最大行宽（去除HTML标签）
    const maxLineWidth = Math.max(...lines.map(line => line.replace(/<[^>]*>/g, '').length))
    // 填充每行到相同宽度
    const paddedLines = lines.map((line) => {
      const visibleLength = line.replace(/<[^>]*>/g, '').length
      return line + ' '.repeat(maxLineWidth - visibleLength)
    })
    return addBorder(paddedLines, maxLineWidth, paddedLines.length, config.style.borderStyle)
  }

  return lines
}
