import type { Node, PathfindingParams } from './types'
import { NodeState, NodeType } from './types'

export function useGrid(canvasRef: Ref<HTMLCanvasElement | undefined>, params: PathfindingParams) {
  let grid: Node[][] = []
  let cols = 0
  let rows = 0
  let startNode: Node | null = null
  let endNode: Node | null = null

  /**
   * 初始化网格
   */
  function initGrid() {
    const canvas = canvasRef.value
    if (!canvas)
      return

    cols = Math.floor(canvas.width / params.gridSize)
    rows = Math.floor(canvas.height / params.gridSize)

    grid = []
    for (let x = 0; x < cols; x++) {
      grid[x] = []
      for (let y = 0; y < rows; y++) {
        grid[x][y] = {
          x,
          y,
          type: NodeType.EMPTY,
          state: NodeState.UNVISITED,
          g: Infinity,
          h: 0,
          f: Infinity,
          parent: null,
        }
      }
    }

    // 设置默认起点和终点
    startNode = grid[5][5]
    startNode.type = NodeType.START
    endNode = grid[cols - 6][rows - 6]
    endNode.type = NodeType.END
  }

  /**
   * 重置网格状态（保留墙壁）
   */
  function resetGridState() {
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const node = grid[x][y]
        node.state = NodeState.UNVISITED
        node.g = Infinity
        node.h = 0
        node.f = Infinity
        node.parent = null
      }
    }
  }

  /**
   * 清空网格（清除所有墙壁）
   */
  function clearGrid() {
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const node = grid[x][y]
        if (node.type === NodeType.WALL)
          node.type = NodeType.EMPTY

        node.state = NodeState.UNVISITED
        node.g = Infinity
        node.h = 0
        node.f = Infinity
        node.parent = null
      }
    }
  }

  /**
   * 随机生成墙壁
   */
  function generateRandomWalls() {
    clearGrid()
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const node = grid[x][y]
        if (node.type !== NodeType.START && node.type !== NodeType.END) {
          if (Math.random() < params.wallDensity)
            node.type = NodeType.WALL
        }
      }
    }
  }

  /**
   * 生成迷宫（递归分割算法）
   */
  function generateMaze() {
    clearGrid()
    // 先填充所有墙壁
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const node = grid[x][y]
        if (node.type !== NodeType.START && node.type !== NodeType.END)
          node.type = NodeType.WALL
      }
    }
    // 递归分割生成迷宫
    recursiveDivision(1, cols - 2, 1, rows - 2)
  }

  /**
   * 递归分割算法
   */
  function recursiveDivision(x1: number, x2: number, y1: number, y2: number) {
    if (x2 - x1 < 2 || y2 - y1 < 2)
      return

    const horizontal = (x2 - x1) < (y2 - y1)

    if (horizontal) {
      const y = Math.floor(Math.random() * (y2 - y1 - 1)) + y1 + 1
      const hole = Math.floor(Math.random() * (x2 - x1 + 1)) + x1

      for (let x = x1; x <= x2; x++) {
        if (x !== hole && grid[x][y].type !== NodeType.START && grid[x][y].type !== NodeType.END)
          grid[x][y].type = NodeType.WALL
      }

      recursiveDivision(x1, x2, y1, y - 1)
      recursiveDivision(x1, x2, y + 1, y2)
    }
    else {
      const x = Math.floor(Math.random() * (x2 - x1 - 1)) + x1 + 1
      const hole = Math.floor(Math.random() * (y2 - y1 + 1)) + y1

      for (let y = y1; y <= y2; y++) {
        if (y !== hole && grid[x][y].type !== NodeType.START && grid[x][y].type !== NodeType.END)
          grid[x][y].type = NodeType.WALL
      }

      recursiveDivision(x1, x - 1, y1, y2)
      recursiveDivision(x + 1, x2, y1, y2)
    }
  }

  return {
    grid: () => grid,
    cols: () => cols,
    rows: () => rows,
    startNode: () => startNode,
    endNode: () => endNode,
    initGrid,
    resetGridState,
    clearGrid,
    generateRandomWalls,
    generateMaze,
  }
}
