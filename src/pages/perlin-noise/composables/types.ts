/**
 * 噪声参数接口
 */
export interface NoiseParams {
  /** 随机种子 */
  seed: number
  /** 缩放比例 */
  scale: number
  /** 八度数量 */
  octaves: number
  /** 持续度 */
  persistence: number
  /** 间隙度 */
  lacunarity: number
}

/**
 * 地形参数接口
 */
export interface TerrainParams {
  /** 地图宽度 */
  width: number
  /** 地图高度 */
  height: number
  /** 网格细分数 */
  segments: number
  /** 高度缩放 */
  heightScale: number
}

/**
 * 颜色映射点
 */
export interface ColorStop {
  /** 高度阈值 (0-1) */
  height: number
  /** 颜色值 (hex) */
  color: string
}

/**
 * 显示模式
 */
export type DisplayMode = 'solid' | 'wireframe' | 'both'

/**
 * 颜色方案
 */
export type ColorScheme = 'terrain' | 'heatmap'

/**
 * 视觉参数接口
 */
export interface VisualParams {
  /** 显示模式 */
  displayMode: DisplayMode
  /** 颜色方案 */
  colorScheme: ColorScheme
}
