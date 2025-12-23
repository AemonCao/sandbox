/**
 * 边框工具函数
 */
import type { BorderStyle } from '../types'

/**
 * 获取边框字符
 */
function getBorderChars(style: BorderStyle = 'thin') {
  const borderChars: Record<BorderStyle, { topLeft: string, topRight: string, bottomLeft: string, bottomRight: string, horizontal: string, vertical: string }> = {
    thin: { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│' },
    thick: { topLeft: '┏', topRight: '┓', bottomLeft: '┗', bottomRight: '┛', horizontal: '━', vertical: '┃' },
    double: { topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝', horizontal: '═', vertical: '║' },
    rounded: { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯', horizontal: '─', vertical: '│' },
  }
  return borderChars[style]
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
 * 为图表添加边框
 */
export function addBorder(lines: string[], width: number, height: number, borderStyle: BorderStyle = 'thin'): string[] {
  const chars = getBorderChars(borderStyle)
  const result: string[] = []

  // 顶部边框
  result.push(colorize(chars.topLeft + chars.horizontal.repeat(width) + chars.topRight, 'axis'))

  // 中间内容
  for (const line of lines) {
    result.push(colorize(chars.vertical, 'axis') + line + colorize(chars.vertical, 'axis'))
  }

  // 底部边框
  result.push(colorize(chars.bottomLeft + chars.horizontal.repeat(width) + chars.bottomRight, 'axis'))

  return result
}
