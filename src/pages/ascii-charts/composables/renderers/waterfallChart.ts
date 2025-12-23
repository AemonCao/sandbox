/**
 * 瀑布图渲染器
 */
import type { ChartConfig, WaterfallData } from '../types'

/**
 * 包装字符串为带颜色的 HTML span 标签
 */
function colorize(text: string, colorVar?: string): string {
  if (!colorVar)
    return text
  return `<span style="color:var(--chart-${colorVar}-color)">${text}</span>`
}

/**
 * 渲染瀑布图
 */
export function renderWaterfallChart(config: ChartConfig): string[] {
  const data = config.data as WaterfallData
  const { width, height } = config.style

  const canvas: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ' '))

  if (data.stages.length === 0 || data.totalDuration === 0)
    return canvas.map(row => row.join(''))

  // 计算布局
  const availableRows = height - 4 // 顶部和底部各留2行
  const stageHeight = Math.floor(availableRows / data.stages.length)
  const barHeight = Math.max(1, stageHeight - 1) // 阶段条高度，留1行作为间距

  // 时间缩放函数
  const timeScale = (time: number) =>
    Math.round((time / data.totalDuration) * (width - 20)) + 15

  // 绘制阶段
  data.stages.forEach((stage, index) => {
    const yStart = 2 + index * stageHeight
    if (yStart >= height - 2)
      return

    // 阶段名称（垂直居中）
    const nameY = yStart + Math.floor(barHeight / 2)
    const name = stage.name.slice(0, 12).padEnd(12)
    for (let i = 0; i < name.length; i++) {
      canvas[nameY][i] = name[i]
    }

    const startX = timeScale(stage.start)
    const endX = timeScale(stage.start + stage.duration)
    const char = stage.type === 'blocking' ? '█' : '▓'
    const color = stage.type === 'blocking' ? 'blocking' : 'loading'

    // 填充多行
    for (let h = 0; h < barHeight; h++) {
      const y = yStart + h
      if (y >= height)
        break

      // 填充空白区域（开始前）
      for (let x = 15; x < startX && x < width; x++) {
        canvas[y][x] = colorize('░', 'grid')
      }

      // 时间条
      for (let x = startX; x < endX && x < width; x++) {
        canvas[y][x] = colorize(char, color)
      }

      // 填充空白区域（结束后）
      for (let x = endX; x < width; x++) {
        canvas[y][x] = colorize('░', 'grid')
      }
    }

    // 持续时间标注（垂直居中）
    const durationText = `${stage.duration}ms`
    for (let i = 0; i < durationText.length && startX + i < width; i++) {
      canvas[nameY][startX + i] = durationText[i]
    }
  })

  return canvas.map(row => row.join(''))
}
