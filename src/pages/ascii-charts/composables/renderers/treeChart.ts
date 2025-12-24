/**
 * 树图渲染器
 */
import type { ChartConfig, NodeStyle, TreeChartData, TreeNode } from '../types'
import { addBorder } from './borderUtils'

const lightColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
const darkColors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635']

interface NodePosition {
  node: TreeNode
  x: number
  y: number
  depth: number
}

/**
 * 获取边框字符
 */
function getBorderChars(style: string) {
  const borderChars: Record<string, { topLeft: string, topRight: string, bottomLeft: string, bottomRight: string, horizontal: string, vertical: string }> = {
    thin: { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│' },
    thick: { topLeft: '┏', topRight: '┓', bottomLeft: '┗', bottomRight: '┛', horizontal: '━', vertical: '┃' },
    double: { topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝', horizontal: '═', vertical: '║' },
    rounded: { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯', horizontal: '─', vertical: '│' },
  }
  return borderChars[style] || borderChars.thin
}

/**
 * 计算子树宽度
 */
function calculateSubtreeWidth(node: TreeNode, nodeStyle: NodeStyle, siblingSpacing: number): number {
  if (!node.children || node.children.length === 0) {
    return nodeStyle.width
  }
  const childrenWidth = node.children.reduce((sum, child) => sum + calculateSubtreeWidth(child, nodeStyle, siblingSpacing), 0)
  const spacing = (node.children.length - 1) * siblingSpacing
  return Math.max(nodeStyle.width, childrenWidth + spacing)
}

/**
 * 计算子树高度（用于横向布局）
 */
function calculateSubtreeHeight(node: TreeNode, nodeStyle: NodeStyle, siblingSpacing: number): number {
  if (!node.children || node.children.length === 0) {
    return nodeStyle.height
  }
  const childrenHeight = node.children.reduce((sum, child) => sum + calculateSubtreeHeight(child, nodeStyle, siblingSpacing), 0)
  const spacing = (node.children.length - 1) * siblingSpacing
  return Math.max(nodeStyle.height, childrenHeight + spacing)
}

/**
 * 计算节点位置
 */
function calculatePositions(node: TreeNode, nodeStyle: NodeStyle, x: number, y: number, depth: number, direction: string, siblingSpacing: number, levelSpacing: number): NodePosition[] {
  const positions: NodePosition[] = [{ node, x, y, depth }]

  if (!node.children || node.children.length === 0) {
    return positions
  }

  const subtreeWidths = node.children.map(child => calculateSubtreeWidth(child, nodeStyle, siblingSpacing))
  const totalWidth = subtreeWidths.reduce((sum, w) => sum + w, 0) + (node.children.length - 1) * siblingSpacing

  if (direction === 'top-down' || direction === 'bottom-up') {
    let childX = x - Math.floor(totalWidth / 2)
    const childY = direction === 'top-down' ? y + nodeStyle.height + levelSpacing : y - nodeStyle.height - levelSpacing

    node.children.forEach((child, i) => {
      const childWidth = subtreeWidths[i]
      const childCenterX = childX + Math.floor(childWidth / 2)
      positions.push(...calculatePositions(child, nodeStyle, childCenterX, childY, depth + 1, direction, siblingSpacing, levelSpacing))
      childX += childWidth + siblingSpacing
    })
  }
  else {
    const subtreeHeights = node.children.map(child => calculateSubtreeHeight(child, nodeStyle, siblingSpacing))
    const totalHeight = subtreeHeights.reduce((sum, h) => sum + h, 0) + (node.children.length - 1) * siblingSpacing
    let childY = y - Math.floor(totalHeight / 2)
    const childX = direction === 'left-right' ? x + Math.floor(nodeStyle.width / 2) + levelSpacing + Math.floor(nodeStyle.width / 2) : x - Math.floor(nodeStyle.width / 2) - levelSpacing - Math.floor(nodeStyle.width / 2)

    node.children.forEach((child, i) => {
      const childHeight = subtreeHeights[i]
      const childCenterY = childY + Math.floor(childHeight / 2)
      positions.push(...calculatePositions(child, nodeStyle, childX, childCenterY, depth + 1, direction, siblingSpacing, levelSpacing))
      childY += childHeight + siblingSpacing
    })
  }

  return positions
}

/**
 * 绘制节点
 */
function drawNode(canvas: string[][], pos: NodePosition, nodeStyle: NodeStyle, color: string) {
  const { x, y } = pos
  const { width, height, showBorder, borderStyle } = nodeStyle
  const chars = getBorderChars(borderStyle)

  const startX = x - Math.floor(width / 2)
  const startY = y

  for (let dy = 0; dy < height; dy++) {
    const row = startY + dy
    if (row < 0 || row >= canvas.length)
      continue

    for (let dx = 0; dx < width; dx++) {
      const col = startX + dx
      if (col < 0 || col >= canvas[0].length)
        continue

      if (showBorder) {
        if (dy === 0 && dx === 0) {
          canvas[row][col] = `<span style="color:${color}">${chars.topLeft}</span>`
        }
        else if (dy === 0 && dx === width - 1) {
          canvas[row][col] = `<span style="color:${color}">${chars.topRight}</span>`
        }
        else if (dy === height - 1 && dx === 0) {
          canvas[row][col] = `<span style="color:${color}">${chars.bottomLeft}</span>`
        }
        else if (dy === height - 1 && dx === width - 1) {
          canvas[row][col] = `<span style="color:${color}">${chars.bottomRight}</span>`
        }
        else if (dy === 0 || dy === height - 1) {
          canvas[row][col] = `<span style="color:${color}">${chars.horizontal}</span>`
        }
        else if (dx === 0 || dx === width - 1) {
          canvas[row][col] = `<span style="color:${color}">${chars.vertical}</span>`
        }
        else {
          canvas[row][col] = ' '
        }
      }
      else {
        canvas[row][col] = ' '
      }
    }
  }

  // 绘制标签
  const label = pos.node.label.length > width - 2 ? pos.node.label.slice(0, width - 2) : pos.node.label
  const labelX = startX + Math.floor((width - label.length) / 2)
  const labelY = startY + Math.floor(height / 2)

  if (labelY >= 0 && labelY < canvas.length) {
    for (let i = 0; i < label.length; i++) {
      const col = labelX + i
      if (col >= 0 && col < canvas[0].length) {
        canvas[labelY][col] = `<span style="color:${color}">${label[i]}</span>`
      }
    }
  }
}

/**
 * 绘制连接线
 */
function drawConnections(canvas: string[][], positions: NodePosition[], nodeStyle: NodeStyle, direction: string, levelSpacing: number) {
  const posMap = new Map<string, NodePosition>()
  positions.forEach(pos => posMap.set(pos.node.id, pos))

  positions.forEach((pos) => {
    if (!pos.node.children || pos.node.children.length === 0)
      return

    if (direction === 'top-down') {
      const parentX = pos.x
      const parentY = pos.y + nodeStyle.height

      if (pos.node.children.length === 1) {
        const childPos = posMap.get(pos.node.children[0].id)
        if (!childPos)
          return
        for (let y = parentY; y < childPos.y; y++) {
          if (y >= 0 && y < canvas.length && parentX >= 0 && parentX < canvas[0].length && canvas[y][parentX] === ' ')
            canvas[y][parentX] = '<span style="color:var(--chart-grid-color)">│</span>'
        }
        return
      }

      const firstChild = posMap.get(pos.node.children[0].id)
      if (!firstChild)
        return
      const lineY = firstChild.y - 1

      for (let y = parentY; y < lineY; y++) {
        if (y >= 0 && y < canvas.length && parentX >= 0 && parentX < canvas[0].length && canvas[y][parentX] === ' ')
          canvas[y][parentX] = '<span style="color:var(--chart-grid-color)">│</span>'
      }

      const lastChildPos = posMap.get(pos.node.children[pos.node.children.length - 1].id)
      if (!lastChildPos)
        return
      const minX = Math.min(firstChild.x, lastChildPos.x)
      const maxX = Math.max(firstChild.x, lastChildPos.x)
      if (lineY >= 0 && lineY < canvas.length) {
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < canvas[0].length && canvas[lineY][x] === ' ')
            canvas[lineY][x] = '<span style="color:var(--chart-grid-color)">─</span>'
        }
      }

      pos.node.children.forEach((child) => {
        const childPos = posMap.get(child.id)
        if (!childPos)
          return
        for (let y = lineY + 1; y < childPos.y; y++) {
          if (y >= 0 && y < canvas.length && childPos.x >= 0 && childPos.x < canvas[0].length && canvas[y][childPos.x] === ' ')
            canvas[y][childPos.x] = '<span style="color:var(--chart-grid-color)">│</span>'
        }
      })

      if (lineY >= 0 && lineY < canvas.length) {
        pos.node.children.forEach((child, index) => {
          const childPos = posMap.get(child.id)
          if (childPos && childPos.x >= 0 && childPos.x < canvas[0].length) {
            let char = '┬'
            if (index === 0)
              char = '┌'
            else if (index === pos.node.children!.length - 1)
              char = '┐'
            canvas[lineY][childPos.x] = `<span style="color:var(--chart-grid-color)">${char}</span>`
          }
        })

        if (parentX >= 0 && parentX < canvas[0].length) {
          const hasChildAtParent = pos.node.children.some(child => posMap.get(child.id)?.x === parentX)
          canvas[lineY][parentX] = `<span style="color:var(--chart-grid-color)">${hasChildAtParent ? '┼' : '┴'}</span>`
        }
      }
    }
    else if (direction === 'bottom-up') {
      const parentX = pos.x
      const parentY = pos.y

      if (pos.node.children.length === 1) {
        const childPos = posMap.get(pos.node.children[0].id)
        if (!childPos)
          return
        for (let y = childPos.y + nodeStyle.height; y <= parentY; y++) {
          if (y >= 0 && y < canvas.length && parentX >= 0 && parentX < canvas[0].length && canvas[y][parentX] === ' ')
            canvas[y][parentX] = '<span style="color:var(--chart-grid-color)">│</span>'
        }
        return
      }

      const firstChild = posMap.get(pos.node.children[0].id)
      if (!firstChild)
        return
      const lineY = firstChild.y + nodeStyle.height

      for (let y = lineY; y < parentY; y++) {
        if (y >= 0 && y < canvas.length && parentX >= 0 && parentX < canvas[0].length && canvas[y][parentX] === ' ')
          canvas[y][parentX] = '<span style="color:var(--chart-grid-color)">│</span>'
      }

      const lastChildPos = posMap.get(pos.node.children[pos.node.children.length - 1].id)
      if (!lastChildPos)
        return
      const minX = Math.min(firstChild.x, lastChildPos.x)
      const maxX = Math.max(firstChild.x, lastChildPos.x)
      if (lineY >= 0 && lineY < canvas.length) {
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < canvas[0].length && canvas[lineY][x] === ' ')
            canvas[lineY][x] = '<span style="color:var(--chart-grid-color)">─</span>'
        }
      }

      pos.node.children.forEach((child) => {
        const childPos = posMap.get(child.id)
        if (!childPos)
          return
        for (let y = childPos.y + nodeStyle.height; y < lineY; y++) {
          if (y >= 0 && y < canvas.length && childPos.x >= 0 && childPos.x < canvas[0].length && canvas[y][childPos.x] === ' ')
            canvas[y][childPos.x] = '<span style="color:var(--chart-grid-color)">│</span>'
        }
      })

      if (lineY >= 0 && lineY < canvas.length) {
        pos.node.children.forEach((child, index) => {
          const childPos = posMap.get(child.id)
          if (childPos && childPos.x >= 0 && childPos.x < canvas[0].length) {
            let char = '┴'
            if (index === 0)
              char = '└'
            else if (index === pos.node.children!.length - 1)
              char = '┘'
            canvas[lineY][childPos.x] = `<span style="color:var(--chart-grid-color)">${char}</span>`
          }
        })

        if (parentX >= 0 && parentX < canvas[0].length) {
          const hasChildAtParent = pos.node.children.some(child => posMap.get(child.id)?.x === parentX)
          canvas[lineY][parentX] = `<span style="color:var(--chart-grid-color)">${hasChildAtParent ? '┼' : '┬'}</span>`
        }
      }
    }
    else {
      // left-right or right-left
      const parentY = pos.y + Math.floor(nodeStyle.height / 2)
      const parentX = direction === 'left-right' ? pos.x + Math.floor(nodeStyle.width / 2) : pos.x - Math.floor(nodeStyle.width / 2)

      // 只有一个子节点时，直接用横线连接
      if (pos.node.children.length === 1) {
        const childPos = posMap.get(pos.node.children[0].id)
        if (!childPos)
          return
        const childX = direction === 'left-right' ? childPos.x - Math.floor(nodeStyle.width / 2) : childPos.x + Math.floor(nodeStyle.width / 2)
        const minX = Math.min(parentX, childX)
        const maxX = Math.max(parentX, childX)
        for (let x = minX; x <= maxX; x++) {
          if (parentY >= 0 && parentY < canvas.length && x >= 0 && x < canvas[0].length) {
            if (canvas[parentY][x] === ' ') {
              canvas[parentY][x] = '<span style="color:var(--chart-grid-color)">─</span>'
            }
          }
        }
        return
      }

      // 多个子节点时，使用垂直线连接
      const firstChild = posMap.get(pos.node.children[0].id)
      if (!firstChild)
        return
      const lineX = direction === 'left-right'
        ? pos.x + Math.floor(nodeStyle.width / 2) + Math.floor(levelSpacing / 2)
        : pos.x - Math.floor(nodeStyle.width / 2) - Math.floor(levelSpacing / 2) - 1

      // 绘制从父节点到垂直线的水平线（不包括垂直线本身）
      const minX = Math.min(parentX, lineX)
      const maxX = Math.max(parentX, lineX)
      for (let x = minX; x < maxX; x++) {
        if (parentY >= 0 && parentY < canvas.length && x >= 0 && x < canvas[0].length) {
          if (canvas[parentY][x] === ' ') {
            canvas[parentY][x] = '<span style="color:var(--chart-grid-color)">─</span>'
          }
        }
      }

      // 绘制垂直线
      const firstChildPos = posMap.get(pos.node.children[0].id)
      const lastChildPos = posMap.get(pos.node.children[pos.node.children.length - 1].id)
      if (!firstChildPos || !lastChildPos)
        return
      const minY = Math.min(firstChildPos.y + Math.floor(nodeStyle.height / 2), lastChildPos.y + Math.floor(nodeStyle.height / 2))
      const maxY = Math.max(firstChildPos.y + Math.floor(nodeStyle.height / 2), lastChildPos.y + Math.floor(nodeStyle.height / 2))
      if (lineX >= 0 && lineX < canvas[0].length) {
        for (let y = minY; y <= maxY; y++) {
          if (y >= 0 && y < canvas.length && canvas[y][lineX] === ' ') {
            canvas[y][lineX] = '<span style="color:var(--chart-grid-color)">│</span>'
          }
        }
      }

      // 绘制从垂直线到各子节点的水平线（不包括垂直线本身）
      pos.node.children.forEach((child) => {
        const childPos = posMap.get(child.id)
        if (!childPos)
          return

        const childX = direction === 'left-right' ? childPos.x - Math.floor(nodeStyle.width / 2) : childPos.x + Math.floor(nodeStyle.width / 2)
        const childY = childPos.y + Math.floor(nodeStyle.height / 2)

        const childMinX = Math.min(lineX, childX)
        const childMaxX = Math.max(lineX, childX)
        const startX = direction === 'left-right' ? childMinX + 1 : childMinX
        for (let x = startX; x <= childMaxX; x++) {
          if (childY >= 0 && childY < canvas.length && x >= 0 && x < canvas[0].length) {
            if (canvas[childY][x] === ' ') {
              canvas[childY][x] = '<span style="color:var(--chart-grid-color)">─</span>'
            }
          }
        }
      })

      // 绘制连接点
      if (lineX >= 0 && lineX < canvas[0].length) {
        // 先绘制所有子节点连接点
        pos.node.children.forEach((child, index) => {
          const childPos = posMap.get(child.id)
          if (childPos) {
            const childY = childPos.y + Math.floor(nodeStyle.height / 2)
            if (childY >= 0 && childY < canvas.length) {
              let char = direction === 'left-right' ? '├' : '┤'
              if (index === 0) {
                char = direction === 'left-right' ? '┌' : '┐'
              }
              else if (index === pos.node.children!.length - 1) {
                char = direction === 'left-right' ? '└' : '┘'
              }
              canvas[childY][lineX] = `<span style="color:var(--chart-grid-color)">${char}</span>`
            }
          }
        })

        // 最后绘制父节点连接点，检查是否与子节点重合
        if (parentY >= 0 && parentY < canvas.length) {
          const hasChildAtParent = pos.node.children.some((child) => {
            const childPos = posMap.get(child.id)
            return childPos && childPos.y + Math.floor(nodeStyle.height / 2) === parentY
          })
          const char = hasChildAtParent ? '┼' : (direction === 'left-right' ? '┤' : '├')
          canvas[parentY][lineX] = `<span style="color:var(--chart-grid-color)">${char}</span>`
        }
      }
    }
  })
}

/**
 * 渲染树图
 */
export function renderTreeChart(config: ChartConfig): string[] {
  const data = config.data as TreeChartData
  const nodeStyle = data.nodeStyle || {
    borderStyle: 'thin',
    showBorder: true,
    width: 8,
    height: 3,
  }

  const siblingSpacing = data.siblingSpacing ?? 4
  const levelSpacing = data.levelSpacing ?? 3

  const isDark = document.documentElement.classList.contains('dark')
  const colors = isDark ? darkColors : lightColors
  const direction = data.direction || 'top-down'

  // 计算树的深度
  function getDepth(node: TreeNode): number {
    if (!node.children || node.children.length === 0)
      return 1
    return 1 + Math.max(...node.children.map(getDepth))
  }

  const treeDepth = getDepth(data.root)
  const treeWidth = calculateSubtreeWidth(data.root, nodeStyle, siblingSpacing)
  const treeHeight = calculateSubtreeHeight(data.root, nodeStyle, siblingSpacing)

  // 根据方向计算画布尺寸
  let canvasWidth: number, canvasHeight: number, startX: number, startY: number

  if (direction === 'top-down') {
    canvasWidth = treeWidth
    canvasHeight = treeDepth * (nodeStyle.height + levelSpacing) - levelSpacing
    startX = Math.floor(treeWidth / 2)
    startY = 0
  }
  else if (direction === 'bottom-up') {
    canvasWidth = treeWidth
    canvasHeight = treeDepth * (nodeStyle.height + levelSpacing) - levelSpacing
    startX = Math.floor(treeWidth / 2)
    startY = canvasHeight - nodeStyle.height
  }
  else if (direction === 'left-right') {
    canvasWidth = treeDepth * (nodeStyle.width + levelSpacing) - levelSpacing
    canvasHeight = treeHeight
    startX = Math.floor(nodeStyle.width / 2)
    startY = Math.floor(treeHeight / 2) - Math.floor(nodeStyle.height / 2)
  }
  else {
    canvasWidth = treeDepth * (nodeStyle.width + levelSpacing) - levelSpacing
    canvasHeight = treeHeight
    startX = canvasWidth - Math.floor(nodeStyle.width / 2) - 1
    startY = Math.floor(treeHeight / 2) - Math.floor(nodeStyle.height / 2)
  }

  // 计算布局
  const positions = calculatePositions(data.root, nodeStyle, startX, startY, 0, direction, siblingSpacing, levelSpacing)

  // 创建画布
  const canvas: string[][] = Array.from({ length: canvasHeight }, () =>
    Array.from({ length: canvasWidth }, () => ' '))

  // 绘制连接线
  drawConnections(canvas, positions, nodeStyle, direction, levelSpacing)

  // 绘制节点
  positions.forEach((pos) => {
    const color = pos.node.color || colors[pos.depth % colors.length]
    drawNode(canvas, pos, nodeStyle, color)
  })

  // 转换为字符串数组
  const lines = canvas.map(row => row.join(''))

  // 添加外框
  if (config.style.showBorder) {
    return addBorder(lines, canvasWidth, canvasHeight, config.style.borderStyle || 'thin', 1)
  }

  return lines
}
