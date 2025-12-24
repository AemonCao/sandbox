/**
 * 节点类型枚举
 */
export enum NodeType {
  EMPTY = 0, // 空节点
  WALL = 1, // 障碍物
  START = 2, // 起点
  END = 3, // 终点
}

/**
 * 节点状态枚举（用于可视化）
 */
export enum NodeState {
  UNVISITED = 0, // 未访问
  VISITING = 1, // 正在访问（开放列表）
  VISITED = 2, // 已访问（关闭列表）
  PATH = 3, // 最终路径
}

/**
 * 网格节点
 */
export interface Node {
  x: number
  y: number
  type: NodeType
  state: NodeState
  g: number // 从起点到当前节点的实际代价
  h: number // 从当前节点到终点的启发式估计
  f: number // f = g + h
  parent: Node | null
}

/**
 * 算法类型
 */
export type AlgorithmType = 'astar' | 'dijkstra' | 'bfs' | 'dfs'

/**
 * 动画帧
 */
export interface AnimationFrame {
  type: 'visit' | 'path'
  node: Node
}

/**
 * GUI 参数
 */
export interface PathfindingParams {
  algorithm: AlgorithmType
  gridSize: number // 网格大小（每个格子的像素）
  animationSpeed: number // 动画速度（FPS）
  isPlaying: boolean // 是否正在播放
  allowDiagonal: boolean // 是否允许对角线移动
  wallDensity: number // 随机生成墙壁的密度
}
