/**
 * 时间轴/甘特图渲染器
 */
import type { ChartConfig, TimelineData } from '../types'

/**
 * 包装字符串为带颜色的 HTML span 标签
 */
function colorize(text: string, colorVar?: string): string {
  if (!colorVar)
    return text
  return `<span style="color:var(--chart-${colorVar}-color)">${text}</span>`
}

/**
 * 渲染时间轴图
 */
export function renderTimelineChart(config: ChartConfig): string[] {
  const data = config.data as TimelineData
  const { width, height } = config.style

  const canvas: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ' '))

  if (data.tasks.length === 0 || data.totalTime === 0)
    return canvas.map(row => row.join(''))

  // 计算最大任务名称长度
  const maxNameLength = Math.max(...data.tasks.map(t => t.name.length))
  const labelWidth = Math.min(maxNameLength + 2, width - 20)

  // 计算布局
  const axisY = height - 3 // X轴位置
  const lastAvailableY = axisY - 2 // 最后可用行（X轴上方留1行空白）

  // 计算每个任务的高度（包含任务条和间距）
  const availableRows = lastAvailableY - 2 + 1 // 从第2行到lastAvailableY
  const taskHeight = Math.floor(availableRows / data.tasks.length)
  const barHeight = Math.max(1, taskHeight - 1) // 任务条高度，留1行作为间距
  const remainder = availableRows % data.tasks.length // 剩余行数
  const firstTaskY = 2 + remainder // 剩余部分放在顶部

  // 时间缩放函数
  const timeScale = (time: number) =>
    Math.round((time / data.totalTime) * (width - labelWidth - 5)) + labelWidth + 3

  // 绘制任务
  data.tasks.forEach((task, index) => {
    const yStart = firstTaskY + index * taskHeight
    const actualBarHeight = (index === data.tasks.length - 1)
      ? Math.min(barHeight, lastAvailableY - yStart + 1) // 最后一项不超过可用范围
      : barHeight

    // 任务名称（垂直居中）
    const nameY = yStart + Math.floor(actualBarHeight / 2)
    const name = task.name.slice(0, labelWidth)
    for (let i = 0; i < name.length; i++) {
      canvas[nameY][i] = name[i]
    }

    // 时间条（填充多行）
    const startX = timeScale(task.start)
    const endX = timeScale(task.end)

    for (let h = 0; h < actualBarHeight; h++) {
      const y = yStart + h
      if (y < height) {
        for (let x = startX; x <= endX && x < width; x++) {
          canvas[y][x] = colorize('█', 'bar')
        }
      }
    }

    // 时间标注（垂直居中）
    const duration = task.end - task.start
    const durationText = `${duration}ms`
    const labelX = endX + 2
    for (let i = 0; i < durationText.length && labelX + i < width; i++) {
      canvas[nameY][labelX + i] = durationText[i]
    }
  })

  // 绘制时间轴
  const axisStart = labelWidth + 3
  const axisEnd = width - 1

  for (let x = axisStart; x <= axisEnd; x++) {
    canvas[axisY][x] = colorize('─', 'axis')
  }

  // 时间刻度
  canvas[axisY][axisStart] = colorize('├', 'axis')
  canvas[axisY][axisEnd] = colorize('┤', 'axis')

  // 添加中间刻度和时间标签
  const tickCount = 4
  for (let i = 0; i <= tickCount; i++) {
    const tickX = Math.round(axisStart + (axisEnd - axisStart) * i / tickCount)
    if (i > 0 && i < tickCount) {
      canvas[axisY][tickX] = colorize('┼', 'axis')
    }

    const tickTime = Math.round(data.totalTime * i / tickCount)
    const tickText = `${tickTime}ms`
    let textX = tickX - Math.floor(tickText.length / 2)

    // 最后一个刻度右对齐
    if (i === tickCount) {
      textX = width - tickText.length
    }

    for (let j = 0; j < tickText.length && textX + j < width; j++) {
      if (textX + j >= 0) {
        canvas[axisY + 1][textX + j] = tickText[j]
      }
    }
  }

  return canvas.map(row => row.join(''))
}
