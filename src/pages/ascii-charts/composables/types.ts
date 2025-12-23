/**
 * ASCII 字符图表渲染引擎 - 类型定义
 */

// 图表类型
export type ChartType = 'line' | 'bar' | 'timeline' | 'waterfall'

// 网格样式类型
export type GridStyle = 'thin-medium' | 'thick-medium' | 'thin-dense' | 'thick-dense' | 'thin-solid' | 'thick-solid'

// 柱状图样式类型
export type BarStyle = 'solid' | 'shadow' | 'hollow' | 'bold-hollow' | 'double-line' | 'rounded'

// 样式配置
export interface ChartStyle {
  width: number // 图表宽度（字符数）
  height: number // 图表高度（行数）
  showAxis: boolean // 显示坐标轴
  showGrid: boolean // 显示网格
  showHorizontalGrid: boolean // 显示横向网格
  showVerticalGrid: boolean // 显示纵向网格
  gridStyle?: GridStyle // 网格样式
  colors?: {
    axis?: string // 坐标轴颜色 (CSS color)
    grid?: string // 网格颜色 (CSS color)
    line?: string // 折线颜色 (CSS color)
    point?: string // 数据点颜色 (CSS color)
  }
}

// 折线图数据
export interface LineChartData {
  series: Array<{
    name: string
    data: Array<{ x: number, y: number }>
    symbol: string // 数据点符号：●
    color?: string // 系列颜色 (CSS color)
  }>
}

// 柱状图数据
export interface BarChartData {
  categories: string[]
  values: number[]
  barChar: string // 柱子字符：█
  barStyle?: BarStyle // 柱子样式
}

// 时间轴数据
export interface TimelineData {
  tasks: Array<{
    name: string
    start: number
    end: number
  }>
  totalTime: number
}

// 瀑布图数据
export interface WaterfallData {
  stages: Array<{
    name: string
    start: number
    duration: number
    type: 'blocking' | 'loading'
  }>
  totalDuration: number
}

// 统一配置
export interface ChartConfig {
  type: ChartType
  style: ChartStyle
  data: LineChartData | BarChartData | TimelineData | WaterfallData
}
