# Vue 3 前端沙盒项目

一个基于 Vue 3 的现代化前端沙盒环境，用于快速原型开发、组件测试和技术演示。包含蓝牙定位、机器学习、数据可视化等多个完整的技术演示案例。

## ✨ 特性

- 🚀 **Vue 3 + Vite** - 使用最新的 Vue 3 Composition API 和超快的 Vite 构建工具
- 🎨 **UnoCSS** - 原子化 CSS 引擎，支持属性化模式和即时按需生成
- 🛠️ **TypeScript** - 完整的 TypeScript 支持，类型安全
- 📁 **文件路由** - 基于文件结构的自动路由系统
- 🎯 **自动导入** - 组件、API 和工具函数自动导入，无需手动引入
- 🌙 **暗色模式** - 内置的暗色/亮色主题切换
- 📊 **ECharts** - 强大的数据可视化图表库
- 🎪 **Naive UI** - 优雅的 Vue 3 组件库
- 🤖 **TensorFlow.js** - 浏览器端机器学习支持
- 🎮 **Three.js** - 3D 图形渲染
- 🔧 **ESLint + Prettier** - 代码质量和格式化工具
- 🧪 **Vitest** - 单元测试框架

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

项目将在 `http://localhost:3333` 启动，并自动打开浏览器。

### 构建

```bash
# 生产环境构建
pnpm build

# 预览生产构建
pnpm preview

# 特定环境构建
pnpm build:staging
```

### 代码质量

```bash
# 代码检查和自动修复
pnpm lint

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

## 📁 项目结构

```
src/
├── assets/          # 静态资源 (图片、字体等)
├── components/      # Vue 组件 (自动导入)
├── composables/     # Vue 组合式函数 (自动导入)
│   ├── dark.ts      # 暗色模式组合式函数
│   └── useEcharts.ts # ECharts 集成组合式函数
├── data/            # 静态数据和预设配置
│   └── presets/     # 预设配置文件
├── layouts/         # 布局组件
│   └── default.vue  # 默认布局 (动态标题管理)
├── pages/           # 页面组件 (文件路由)
│   ├── index.vue                      # 主页 (显示所有可用路由)
│   ├── bluetooth-json/                # 蓝牙信标解析
│   ├── boids-flocking/                # 鸟群算法模拟
│   ├── ibeacon-simulator/             # 室内蓝牙定位模拟器
│   ├── infusion-monitoring/           # 智能输液监控
│   ├── mnist-data-preview/            # MNIST数据预览
│   ├── mnist-recognition/             # 手写数字识别
│   ├── perlin-noise/                  # Perlin噪声地图生成器
│   ├── positioning-algorithms/        # 多算法定位引擎对比
│   ├── sensor-dashboard/              # 传感器数据仪表盘
│   └── [...all].vue                   # 404 捕获路由
├── styles/          # 全局样式和主题配置
│   └── customTheme.ts # Naive UI 主题自定义
├── main.ts          # 应用入口
└── App.vue          # 根组件
```

## 🛣️ 路由系统

项目使用文件路由系统，页面文件会自动生成对应的路由：

- `src/pages/index.vue` → `/`
- `src/pages/about.vue` → `/about`
- `src/pages/users/[id].vue` → `/users/:id`
- `src/pages/blog/[...all].vue` → `/blog/*` (catch-all)

每个页面可以在 `<route>` 块中定义路由元数据：

```vue
<route lang="yaml">
meta:
  layout: default
  title: '页面标题'
  description: '页面简介'
</route>
```

## 🎨 样式系统

### UnoCSS

使用 UnoCSS 作为样式引擎，支持原子化 CSS：

```vue
<template>
  <div p-4 flex items-center justify-center>
    <h1 text-2xl font-bold text-center>
      标题
    </h1>
  </div>
</template>
```

### 主题系统

内置暗色/亮色主题支持：

```typescript
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
```

## 📦 自动导入

以下内容会自动导入，无需手动引入：

### Vue APIs

- `ref`, `reactive`, `computed` 等 Vue 3 核心API
- `onMounted`, `onUnmounted` 等生命周期钩子

### 组件

- `src/components/` 下的所有 Vue 组件
- Naive UI 组件

### 工具函数

- `src/composables/` 下的组合式函数
- VueUse 工具函数

## 📊 数据可视化

项目集成了 ECharts 图表库，并提供了便捷的组合式函数：

```typescript
import { useEcharts } from '~/composables/useEcharts'

const { chartRef, initChart } = useEcharts()

onMounted(() => {
  initChart({
    // ECharts 配置选项
  })
})
```

## 🧪 测试

使用 Vitest 进行单元测试：

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test --watch
```

## 🔧 配置

### 路径别名

- `~/` → `src/`
- `@/` → `src/`

### 环境变量

支持 `.env`、`.env.development`、`.env.production` 等环境变量文件。

## 📝 示例页面

项目包含多个完整的技术演示案例：

### 1. 🔵 蓝牙信标解析 (Bluetooth Beacon Parser)

**路径**: `/bluetooth-json`

解析和分析蓝牙广播包数据，支持多种格式的蓝牙信标数据解析。

**功能特性**:

- 支持解析多种格式的蓝牙广播包数据
- 提供详细的 AD 结构分析
- 包含 iBeacon 数据解析
- 支持批量数据处理和过滤

**技术栈**: JSON 解析、数据可视化

### 2. 📍 室内蓝牙定位模拟器 (Indoor Bluetooth Positioning Simulator)

**路径**: `/ibeacon-simulator`

基于三角定位算法的室内蓝牙定位模拟器，提供交互式可视化界面。

**功能特性**:

- 三角定位算法实时计算
- 交互式 Canvas 画布
- 信号强度模拟
- 实时位置计算和显示

**技术栈**: Canvas API、几何算法、信号强度模拟

**核心组件**:

- `BeaconCanvas` - 信标画布组件
- `ControlPanel` - 控制面板
- `FormulaPanel` - 公式展示面板
- `InfoPanel` - 信息面板

### 3. 💉 智能输液监控 (Infusion Monitoring)

**路径**: `/infusion-monitoring`

医疗场景下的智能输液监控系统。

**功能特性**:

- 实时数据监控
- 告警系统
- 输液进度跟踪

**技术栈**: 实时数据监控、告警系统

### 4. 🔢 MNIST数据预览 (MNIST Data Preview)

**路径**: `/mnist-data-preview`

预览 MNIST 手写数字数据集，用于机器学习训练前的数据探索。

**功能特性**:

- MNIST 数据集可视化
- 数据集统计信息
- 样本浏览

**技术栈**: TensorFlow.js、数据可视化

### 5. ✍️ 手写数字识别 (Handwritten Digit Recognition)

**路径**: `/mnist-recognition`

基于 TensorFlow.js 的手写数字识别系统，支持模型训练和实时预测。

**功能特性**:

- 交互式绘图画布
- 神经网络训练
- 实时数字识别
- 模型管理和保存

**技术栈**: TensorFlow.js (WebGL 后端)、Canvas API、神经网络训练

**核心组件**:

- `DrawingCanvas` - 绘图画布
- `ModelControls` - 模型控制
- `ModelManager` - 模型管理器
- `PredictionList` - 预测结果列表
- `TrainingPanel` - 训练面板

### 6. 🎯 多算法定位引擎对比 (Multi-Algorithm Positioning Engine Comparison)

**路径**: `/positioning-algorithms`

对比不同定位算法的性能和精度，包括三角定位、质心定位、加权质心等多种算法。

**功能特性**:

- 多种定位算法实现
- 算法性能对比
- 可视化展示
- 实时计算和分析

**技术栈**: 算法可视化、性能指标分析

### 7. 📊 传感器数据仪表盘 (Sensor Dashboard)

**路径**: `/sensor-dashboard`

实时传感器数据监控仪表盘，展示温度、湿度等环境数据。

**功能特性**:

- 实时数据展示
- 历史数据图表
- 多传感器支持
- 响应式布局

**技术栈**: ECharts、实时数据可视化

### 8. 🐦 鸟群算法模拟 (Boids Flocking)

**路径**: `/boids-flocking`

基于 Boids 算法的鸟群行为模拟，展示分离、对齐、聚集三大规则的群体智能行为。

**功能特性**:

- 实时鸟群行为模拟
- 捕食者追逐行为
- 光源吸引效果
- 边界行为控制 (反弹/环绕)
- 可调节的群体参数
- 交互式 GUI 控制面板

**技术栈**: Canvas API、群体智能算法、lil-gui

### 9. 🗺️ Perlin噪声地图生成器 (Perlin Noise Map Generator)

**路径**: `/perlin-noise`

使用 Simplex 噪声算法生成类似 Minecraft 的程序化 3D 地形。

**功能特性**:

- 实时 3D 地形生成
- 多层噪声叠加 (Octaves)
- 可调节的噪声参数
- 多种显示模式 (实体/线框/混合)
- 多种颜色方案 (地形/热力图)
- 交互式 3D 视图 (旋转/缩放)

**技术栈**: Three.js、Simplex Noise、lil-gui

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### Git 提交规范

提交代码时请遵循以下规范：

- **语言**: 使用中文编写提交信息
- **格式**: 遵循 Conventional Commits 规范
- **Emoji**: 使用 emoji 作为提交类型的视觉指示器

#### 常用提交类型

- ✨ `feat`: 新功能
- 🐛 `fix`: 修复bug
- 📝 `docs`: 文档更新
- 🎨 `style`: 代码格式调整
- ♻️ `refactor`: 代码重构
- ⚡ `perf`: 性能优化
- ✅ `test`: 测试相关
- 🔧 `chore`: 构建工具或依赖更新

#### 提交示例

```bash
feat(positioning): ✨ 添加新的定位算法
fix(canvas): 🐛 修复画布渲染问题
docs(readme): 📝 更新项目说明文档
```

## 📄 许可证

MIT License
