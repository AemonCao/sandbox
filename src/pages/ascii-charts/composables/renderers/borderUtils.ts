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
 * 为图表添加边框和内边距
 */
export function addBorder(lines: string[], width: number, height: number, borderStyle: BorderStyle = 'thin', padding = 1): string[] {
  const chars = getBorderChars(borderStyle)
  const result: string[] = []

  // 计算实际内容宽度（去除HTML标签后的最大宽度）
  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '')
  const actualWidth = Math.max(...lines.map(line => stripHtml(line).length))
  const innerWidth = actualWidth + padding * 2

  // 顶部边框
  result.push(colorize(chars.topLeft + chars.horizontal.repeat(innerWidth) + chars.topRight, 'axis'))

  // 顶部内边距
  for (let i = 0; i < padding; i++) {
    result.push(colorize(chars.vertical, 'axis') + ' '.repeat(innerWidth) + colorize(chars.vertical, 'axis'))
  }

  // 中间内容 - 确保每行都填充到相同宽度
  for (const line of lines) {
    const lineWidth = stripHtml(line).length
    const paddedLine = ' '.repeat(padding) + line + ' '.repeat(actualWidth - lineWidth + padding)
    result.push(colorize(chars.vertical, 'axis') + paddedLine + colorize(chars.vertical, 'axis'))
  }

  // 底部内边距
  for (let i = 0; i < padding; i++) {
    result.push(colorize(chars.vertical, 'axis') + ' '.repeat(innerWidth) + colorize(chars.vertical, 'axis'))
  }

  // 底部边框
  result.push(colorize(chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight, 'axis'))

  return result
}
