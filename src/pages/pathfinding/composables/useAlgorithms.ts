import type { AlgorithmType, AnimationFrame, Node } from './types'
import { NodeType } from './types'

export function useAlgorithms() {
  /**
   * 运行指定算法
   */
  function runAlgorithm(
    algorithm: AlgorithmType,
    grid: Node[][],
    start: Node | null,
    end: Node | null,
    allowDiagonal: boolean,
  ): AnimationFrame[] {
    if (!start || !end)
      return []

    switch (algorithm) {
      case 'astar':
        return astar(grid, start, end, allowDiagonal)
      case 'dijkstra':
        return dijkstra(grid, start, end, allowDiagonal)
      case 'bfs':
        return bfs(grid, start, end, allowDiagonal)
      case 'dfs':
        return dfs(grid, start, end, allowDiagonal)
      default:
        return []
    }
  }

  /**
   * A* 算法
   */
  function astar(grid: Node[][], start: Node, end: Node, allowDiagonal: boolean): AnimationFrame[] {
    const frames: AnimationFrame[] = []
    const openSet: Node[] = [start]
    const closedSet = new Set<Node>()

    // 初始化起点
    start.g = 0
    start.h = heuristic(start, end)
    start.f = start.h

    while (openSet.length > 0) {
      // 找到 f 值最小的节点
      const current = openSet.reduce((min, node) => node.f < min.f ? node : min)

      // 记录访问帧
      if (current !== start)
        frames.push({ type: 'visit', node: current })

      if (current === end) {
        // 找到路径，回溯生成路径帧
        const path = reconstructPath(current)
        path.forEach(node => frames.push({ type: 'path', node }))
        break
      }

      openSet.splice(openSet.indexOf(current), 1)
      closedSet.add(current)

      // 遍历邻居
      const neighbors = getNeighbors(grid, current, allowDiagonal)
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor) || neighbor.type === NodeType.WALL)
          continue

        const tentativeG = current.g + 1

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor)
        }
        else if (tentativeG >= neighbor.g) {
          continue
        }

        neighbor.parent = current
        neighbor.g = tentativeG
        neighbor.h = heuristic(neighbor, end)
        neighbor.f = neighbor.g + neighbor.h
      }
    }

    return frames
  }

  /**
   * Dijkstra 算法（A* 的特例，h = 0）
   */
  function dijkstra(grid: Node[][], start: Node, end: Node, allowDiagonal: boolean): AnimationFrame[] {
    const frames: AnimationFrame[] = []
    const openSet: Node[] = [start]
    const closedSet = new Set<Node>()

    start.g = 0
    start.f = 0

    while (openSet.length > 0) {
      const current = openSet.reduce((min, node) => node.g < min.g ? node : min)

      if (current !== start)
        frames.push({ type: 'visit', node: current })

      if (current === end) {
        const path = reconstructPath(current)
        path.forEach(node => frames.push({ type: 'path', node }))
        break
      }

      openSet.splice(openSet.indexOf(current), 1)
      closedSet.add(current)

      const neighbors = getNeighbors(grid, current, allowDiagonal)
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor) || neighbor.type === NodeType.WALL)
          continue

        const tentativeG = current.g + 1

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor)
        }
        else if (tentativeG >= neighbor.g) {
          continue
        }

        neighbor.parent = current
        neighbor.g = tentativeG
        neighbor.f = neighbor.g
      }
    }

    return frames
  }

  /**
   * BFS 广度优先搜索
   */
  function bfs(grid: Node[][], start: Node, end: Node, allowDiagonal: boolean): AnimationFrame[] {
    const frames: AnimationFrame[] = []
    const queue: Node[] = [start]
    const visited = new Set<Node>([start])

    while (queue.length > 0) {
      const current = queue.shift()!

      if (current !== start)
        frames.push({ type: 'visit', node: current })

      if (current === end) {
        const path = reconstructPath(current)
        path.forEach(node => frames.push({ type: 'path', node }))
        break
      }

      const neighbors = getNeighbors(grid, current, allowDiagonal)
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && neighbor.type !== NodeType.WALL) {
          visited.add(neighbor)
          neighbor.parent = current
          queue.push(neighbor)
        }
      }
    }

    return frames
  }

  /**
   * DFS 深度优先搜索
   */
  function dfs(grid: Node[][], start: Node, end: Node, allowDiagonal: boolean): AnimationFrame[] {
    const frames: AnimationFrame[] = []
    const stack: Node[] = [start]
    const visited = new Set<Node>()

    while (stack.length > 0) {
      const current = stack.pop()!

      if (visited.has(current))
        continue
      visited.add(current)

      if (current !== start)
        frames.push({ type: 'visit', node: current })

      if (current === end) {
        const path = reconstructPath(current)
        path.forEach(node => frames.push({ type: 'path', node }))
        break
      }

      const neighbors = getNeighbors(grid, current, allowDiagonal)
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && neighbor.type !== NodeType.WALL) {
          neighbor.parent = current
          stack.push(neighbor)
        }
      }
    }

    return frames
  }

  /**
   * 曼哈顿距离启发式函数
   */
  function heuristic(a: Node, b: Node): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  /**
   * 获取邻居节点
   */
  function getNeighbors(grid: Node[][], node: Node, allowDiagonal: boolean): Node[] {
    const neighbors: Node[] = []
    const { x, y } = node
    const cols = grid.length
    const rows = grid[0].length

    // 上下左右
    if (x > 0)
      neighbors.push(grid[x - 1][y])
    if (x < cols - 1)
      neighbors.push(grid[x + 1][y])
    if (y > 0)
      neighbors.push(grid[x][y - 1])
    if (y < rows - 1)
      neighbors.push(grid[x][y + 1])

    // 对角线
    if (allowDiagonal) {
      if (x > 0 && y > 0)
        neighbors.push(grid[x - 1][y - 1])
      if (x > 0 && y < rows - 1)
        neighbors.push(grid[x - 1][y + 1])
      if (x < cols - 1 && y > 0)
        neighbors.push(grid[x + 1][y - 1])
      if (x < cols - 1 && y < rows - 1)
        neighbors.push(grid[x + 1][y + 1])
    }

    return neighbors
  }

  /**
   * 回溯生成路径
   */
  function reconstructPath(endNode: Node): Node[] {
    const path: Node[] = []
    let current: Node | null = endNode

    while (current) {
      path.unshift(current)
      current = current.parent
    }

    return path
  }

  return {
    runAlgorithm,
  }
}
