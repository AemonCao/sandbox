# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 frontend sandbox project used for running demo code and debugging new components. The project provides a modern development environment for rapid prototyping, testing, and showcasing various technical demos including:

- **ASCII Visualization**: Pure text-based chart rendering engine
- **Bluetooth & IoT**: Bluetooth beacon parsing, iBeacon positioning simulation
- **Machine Learning**: MNIST handwritten digit recognition with TensorFlow.js
- **Data Visualization**: ECharts integration for complex data display
- **Healthcare**: Infusion monitoring systems
- **Algorithms**: Boids flocking simulation, Perlin noise terrain generation

## Common Development Commands

### Package Management

- Install dependencies: `pnpm install`
- Update dependencies: `pnpm up` (uses taze for dependency updates)
- Run post-install hooks: `npx simple-git-hooks`

### Development

- Start development server: `pnpm dev` (port 3333)
- Build for production: `pnpm build`
- Build for specific environments: `pnpm build:prod` or `pnpm build:staging`
- Preview production build: `pnpm preview`

### Code Quality

- Linting: `pnpm lint` (ESLint with @antfu/eslint-config)
- Type checking: `pnpm typecheck` (vue-tsc)
- Testing: `pnpm test` (Vitest with jsdom environment)

### Git Hooks

- Pre-commit hooks automatically run lint-staged
- ESLint auto-fix on staged files

## Architecture & Structure

### Tech Stack

- **Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **Build Tool**: Vite with hot module replacement
- **Styling**: UnoCSS for atomic CSS with presetWind4, presetAttributify, presetIcons, and presetWebFonts
- **State Management**: Pinia
- **Routing**: File-based routing via unplugin-vue-router with hash mode
- **UI Library**: Naive UI with auto-import resolvers
- **Data Visualization**: ECharts and ECharts-GL for 2D/3D charts
- **Machine Learning**: TensorFlow.js with WebGL backend
- **3D Graphics**: Three.js for 3D rendering
- **Utilities**: Lodash, nanoid, jszip
- **Head Management**: @unhead/vue for meta tags
- **Type Safety**: TypeScript with strict mode

### Auto-Import System

- Components auto-imported from `src/components/`
- Composables auto-imported from `src/composables/`
- Vue APIs, Vue Router, VueUse, and Naive UI utilities automatically imported
- Type definitions generated automatically
- No manual imports needed for common utilities

### Key Directories

```
src/
├── assets/          # Static resources (images, fonts, etc.)
├── components/      # Vue components (auto-imported)
├── composables/     # Vue composables for reusable logic (auto-imported)
│   ├── dark.ts      # Dark mode composable
│   ├── index.ts     # Composables barrel export
│   └── useEcharts.ts # ECharts integration composable
├── data/            # Static data and presets
│   └── presets/     # Preset configurations
├── layouts/         # Layout components
│   └── default.vue  # Default layout with dynamic title management
├── pages/           # File-based routing (pages become routes automatically)
│   ├── index.vue    # Main homepage showing available routes
│   ├── ascii-charts/index.vue           # ASCII 字符图表渲染引擎
│   ├── bluetooth-json/index.vue         # 蓝牙信标解析
│   ├── boids-flocking/index.vue         # 鸟群算法模拟
│   ├── ibeacon-simulator/index.vue      # 室内蓝牙定位模拟器 (三角定位)
│   ├── infusion-monitoring/index.vue    # 智能输液监控
│   ├── mnist-data-preview/index.vue     # MNIST数据预览
│   ├── mnist-recognition/index.vue      # 手写数字识别
│   ├── perlin-noise/index.vue           # Perlin噪声地图生成器
│   ├── sensor-dashboard/index.vue       # 传感器数据仪表盘
│   ├── conway-game/index.vue            # Conway生命游戏
│   ├── pathfinding/index.vue            # 路径寻找可视化
│   ├── n8n-control/index.vue            # n8n 流程控制
│   └── [...all].vue # Catch-all route for 404 handling
├── styles/          # Global styles and theme configuration
│   └── customTheme.ts # Naive UI theme customization
├── App.vue          # Root component
├── main.ts          # Application entry point
└── naive-ui.d.ts    # Naive UI type definitions
```

### Routing System

- Uses file-based routing with `unplugin-vue-router`
- Routes automatically generated from Vue files in `src/pages/`
- Layout system via `vite-plugin-vue-layouts`
- Hash-based routing for deployment flexibility
- Route meta configuration in `<route>` blocks

### Theme System

- Dark/light theme support with `useDark()` composable
- Naive UI theme customization in `src/styles/customTheme.ts`
- View transitions for theme switching when supported
- Type-safe theme variables with `src/naive-ui.d.ts`

### Build Configuration

- **Path Alias**: `~/` points to `src/` directory
- **Base Path**: `./` for flexible deployment
- **Environment Builds**: Support for development, staging, and production modes
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Vue DevTools**: Integration with VS Code launch support
- **Vite Plugins**:
  - `unplugin-vue-router` - File-based routing
  - `vite-plugin-vue-layouts` - Layout system
  - `unplugin-vue-macros` - Vue macros support (props destructure, defineModel)
  - `unplugin-auto-import` - Auto-import for APIs and composables
  - `unplugin-vue-components` - Auto-import for components
  - `unocss/vite` - Atomic CSS engine
  - `vite-plugin-vue-devtools` - Enhanced Vue DevTools

## Development Guidelines

### Version Management

The project uses automated version management with conventional-changelog:

- **Auto-increment**: Patch version increments automatically on each commit (0.0.1 → 0.0.2)
- **CHANGELOG generation**: Automatically generated based on Conventional Commits
- **Manual control**: Use `pnpm version minor/major` for feature/breaking releases

**Version increment rules**:

- Patch (0.0.1 → 0.0.2): Automatic on every commit
- Minor (0.1.0 → 0.2.0): Use `pnpm version minor` for new features
- Major (1.0.0 → 2.0.0): Use `pnpm version major` for breaking changes

**Workflow**:

1. Daily development: Normal commits auto-increment patch version
2. Feature release: `pnpm version minor` + `pnpm changelog` + commit CHANGELOG
3. Breaking changes: `pnpm version major` + `pnpm changelog` + commit CHANGELOG

### Catalog-based Dependency Management

- Uses pnpm workspace with catalog-based dependency management
- Dependencies organized in catalogs: `build`, `dev`, `frontend`
- Centralized version management across dependencies
- Package manager: pnpm@10.20.0
- Resolutions for `unplugin` and `vite` to ensure version consistency

## Project Structure & Development Patterns

### Page Creation Workflow

- New pages are created in `src/pages/` and automatically become routes
- Each page should include a `<route>` block with YAML metadata for layout and title
- Use `bluetooth-json/index.vue` as a template for new demo pages
- The homepage (`index.vue`) displays available routes using `vue-router/auto-routes`

### Component Development

- Components should be created in `src/components/` (auto-imported)
- Use Naive UI components with auto-import resolvers
- Styling with UnoCSS atomic classes using attributify mode
- Vue 3 Composition API with `<script setup>` syntax

### Code Documentation

- **方法注释**: 编写或修改方法时，必须添加 JSDoc 格式的中文注释，说明方法的功能、参数和返回值
- **关键代码注释**: 在复杂逻辑、算法实现、重要计算等关键代码处添加中文注释，帮助理解代码意图
- **注释示例**:

```typescript
/**
 * 计算两点之间的距离
 * @param x1 - 第一个点的 x 坐标
 * @param y1 - 第一个点的 y 坐标
 * @param x2 - 第二个点的 x 坐标
 * @param y2 - 第二个点的 y 坐标
 * @returns 两点之间的欧几里得距离
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  // 使用勾股定理计算距离
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}
```

### UnoCSS Styling Guidelines

**核心特性：**

- **即时按需生成**：采用预设扫描和即时生成方式，按需生成样式，无需打包未使用的样式
- **完全可定制**：无核心工具类，所有功能通过预设提供，支持自定义规则、快捷方式、变体等
- **高性能**：基于 Rust 的编译时优势，带来更快的运行速度和更小的文件体积
- **完全兼容 Tailwind CSS**：预设 `@unocss/preset-uno` 提供与 Tailwind CSS v3 兼容的工具类

**预设配置 (Presets)：**

- `@unocss/preset-uno`：默认预设，提供与 Tailwind CSS 兼容的工具类
- `@unocss/preset-attributify`：属性化模式，支持将属性作为原子化 CSS 使用
- `@unocss/preset-icons`：图标预设，支持超过 10 万个图标集
- `@unocss/preset-typography`：排版预设，提供优雅的默认排版样式
- `@unocss/preset-web-fonts`：网络字体预设，轻松使用 Google Fonts 等网络字体

**属性化模式 (Attributify Mode)：**

- 使用属性语法：`<div flex items-center justify-center>`
- 等价于：`<div class="flex items-center justify-center">`
- 支持自定义属性值：`<div text="[#667eea]" border="[2px]">`
- 简化复杂样式的书写：`<div grid grid-cols="[1fr,2fr,1fr]">`

**基础工具类：**

- **间距**：`m-4` (margin), `p-2` (padding), `gap-3` (gap between items)
- **布局**：`flex`, `grid`, `block`, `inline-block`, `hidden`
- **定位**：`relative`, `absolute`, `fixed`, `sticky`, `static`
- **尺寸**：`w-full` (width), `h-screen` (height), `max-w-md` (max-width), `min-h-[200px]`
- **颜色**：`bg-white`, `text-gray-600`, `border-blue-500`, `text-[#667eea]`
- **排版**：`text-sm`, `font-bold`, `leading-tight`, `tracking-wide`
- **边框**：`border`, `rounded-lg`, `border-none`, `ring-2`, `shadow-lg`
- **阴影**：`shadow-lg`, `shadow-[0_2px_8px_rgba(0,_0,_0,_0.15)]`, `shadow-blue-500/20`
- **渐变**：`bg-gradient-to-r`, `bg-gradient-to-br`, `from-blue-500 to-purple-600`
- **过渡**：`transition-all`, `duration-300`, `ease-in-out`, `transform`

**响应式设计：**

- 断点前缀：`sm:` (640px+), `md:` (768px+), `lg:` (1024px+), `xl:` (1280px+), `2xl:` (1536px+)
- 示例：`<div grid cols-1 md:cols-2 lg:cols-3>`
- 移动优先：默认样式应用于移动端，通过前缀扩展到更大屏幕

**状态和变体 (States & Variants)：**

- **交互状态**：`hover:bg-blue-500`, `focus:outline-none`, `active:scale-95`
- **组合变体**：`hover:scale-105 transition-transform`
- **暗色模式**：`dark:bg-gray-800` (自动跟随系统主题)
- **条件应用**：`sm:text-lg` (在小屏幕上应用)
- **子元素选择**：`child-hover:scale-110`

**高级功能：**

- **自定义 CSS 属性**：使用 `@property` 支持属性类型检查、设定默认值
- **CSS 变量**：`--custom-color: #667eea; bg-[var(--custom-color)]`
- **计算值**：`w-[calc(100%-2rem)]`, `h-[50vh]`
- **任意值**：`text-[14px]`, `m-[1.5rem]`, `bg-[#hexcode]`
- **组合选择器**：`[&>*]:m-2`, `group-hover:bg-blue-500`

**与 Naive UI 集成：**

- 使用 Naive UI 语义化属性：`bg="n-color-modal"`, `text="n-color-text"`
- 主题感知样式自动适配暗色/亮色模式切换
- CSS 变量继承：`border="n-border-color"`, `bg-hover="n-color-hover"`

**渐变和视觉效果：**

- **线性渐变**：`bg-gradient-to-r from-blue-500 to-purple-600`
- **径向渐变**：`bg-gradient-radial from-blue-400 to-purple-600`
- **自定义颜色**：`bg-gradient-to-br from-[#667eea] to-[#764ba2]`
- **多站渐变**：`bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500`
- **锥形渐变**：`bg-gradient-conic from-blue-400 to-purple-600`
- **重复渐变**：`bg-gradient-to-r from-blue-500 to-purple-600 bg-[length:200%_100%]`

**动画和变换：**

- **基础动画**：`animate-pulse`, `animate-bounce`, `animate-spin`
- **自定义动画**：使用 `@keyframes` 定义并通过 `animate-[custom]` 调用
- **变换**：`scale-105`, `rotate-45`, `translate-x-4`, `skew-y-3`
- **3D 变换**：`perspective-1000`, `rotate-y-180`, `translate-z-20`

### Demo Page Template

```vue
<script setup lang="ts">
// 在这里开始你的开发
</script>

<template>
  <div p-4 min-h-screen from-blue-50 to-indigo-100 bg-gradient-to-br>
    <!-- 在这里开始编写你的页面 -->
    <div flex items-center justify-center>
      <h1 text-2xl font-bold text-center>
        标题
      </h1>
    </div>

    <!-- 渐变按钮示例 -->
    <div mt-8 flex gap-4 justify-center>
      <button bg-gradient-to-r="from-blue-500 to-purple-600" text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105>
        渐变按钮
      </button>

      <button bg-gradient-to-br="from-[#667eea] to-[#764ba2]" text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105>
        自定义渐变
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 仅在需要特殊 CSS 变量或复杂样式时使用 */
/* 优先使用 UnoCSS 属性化模式 */
</style>

<route lang="yaml">
meta:
  layout: default
  title: '新页面'
  description: '页面功能简介'
  tags: ['标签1', '标签2']
</route>
```

## Available MCP Services

This project has access to several Model Context Protocol (MCP) services that extend functionality:

### web-search-prime

- **Status**: ✓ Connected
- **Purpose**: Web search and information retrieval
- **Usage**: Search for current information beyond knowledge cutoff
- **Features**: Returns structured results with titles, URLs, summaries, website metadata

### zai-mcp-server

- **Status**: ✓ Connected
- **Purpose**: AI-powered visual analysis
- **Usage**: Analyze images and videos for content understanding
- **Features**:
  - Image analysis (PNG, JPG, JPEG, max 5MB)
  - Video analysis (MP4, MOV, M4V, max 8MB)
  - Support for local files and remote URLs

### chrome-devtools

- **Status**: ✓ Connected
- **Purpose**: Browser automation and web development tools
- **Usage**: Automated testing, web scraping, performance analysis
- **Features**: Page navigation, screenshots, element interaction, network monitoring

### context7

- **Status**: ✓ Connected
- **Purpose**: 获取组件库和框架的最新文档与代码示例
- **Usage**: 在使用项目中的组件库（Vue、Naive UI、ECharts、Three.js、TensorFlow.js、VueUse、UnoCSS、Pinia 等）时，必须通过 context7 查询其最新文档，确保 API 用法正确
- **调用流程**:
  1. 先调用 `resolve-library-id` 根据库名获取 Context7 兼容的 library ID
  2. 再调用 `query-docs` 传入 library ID 和具体问题，获取最新文档和代码示例
- **适用场景**:
  - 使用 Naive UI 组件时查询其 props、slots、events 的正确用法
  - 使用 ECharts 配置图表时查询 option 配置项
  - 使用 Vue 3 Composition API 时确认 API 签名和最佳实践
  - 使用 Three.js 创建 3D 场景时查询类和方法的用法
  - 使用 VueUse 组合式函数时查询参数和返回值
  - 使用 UnoCSS 时查询预设规则和自定义配置
  - 使用任何不确定用法的第三方库时，优先通过 context7 获取文档而非依赖记忆

## Demo Pages

The project includes several fully functional demo pages showcasing different technologies:

### 1. ASCII 字符图表渲染引擎 (ASCII Charts)

- **Path**: `/ascii-charts`
- **Features**: Pure text-based chart rendering engine supporting 6 chart types (line, bar, timeline, waterfall, pie, tree), responsive design, Google Fonts integration
- **Technologies**: Canvas API, character rendering, responsive design, Google Fonts
- **Components**: ChartControls, ChartDisplay
- **Composables**: useAsciiChart, useFonts, useResponsive

### 2. 蓝牙信标解析 (Bluetooth Beacon Parser)

- **Path**: `/bluetooth-json`
- **Features**: Parse and analyze Bluetooth advertising packets, AD structure analysis,
  iBeacon data parsing
- **Technologies**: JSON parsing, data visualization

### 3. 室内蓝牙定位模拟器 (Indoor Bluetooth Positioning Simulator)

- **Path**: `/ibeacon-simulator`
- **Features**: Triangulation-based positioning simulation, interactive canvas,
  real-time calculations
- **Technologies**: Canvas API, geometric algorithms, signal strength simulation
- **Components**: BeaconCanvas, ControlPanel, FormulaPanel, InfoPanel

### 4. 智能输液监控 (Infusion Monitoring)

- **Path**: `/infusion-monitoring`
- **Features**: Healthcare monitoring system for infusion management
- **Technologies**: Real-time data monitoring, alert systems

### 5. MNIST数据预览 (MNIST Data Preview)

- **Path**: `/mnist-data-preview`
- **Features**: Preview MNIST handwritten digit dataset
- **Technologies**: TensorFlow.js, data visualization

### 6. 手写数字识别 (Handwritten Digit Recognition)

- **Path**: `/mnist-recognition`
- **Features**: Train and test neural networks for digit recognition, interactive drawing canvas,
  model management
- **Technologies**: TensorFlow.js with WebGL backend, Canvas API, neural network training
- **Components**: DrawingCanvas, ModelControls, ModelManager, PredictionList, TrainingPanel

### 7. 鸟群算法模拟 (Boids Flocking)

- **Path**: `/boids-flocking`
- **Features**: Boids algorithm simulation with separation, alignment, and cohesion rules, predator chase behavior, light attraction, boundary control
- **Technologies**: Canvas API, swarm intelligence algorithms, lil-gui

### 8. Perlin噪声地图生成器 (Perlin Noise Map Generator)

- **Path**: `/perlin-noise`
- **Features**: Procedural 3D terrain generation using Simplex noise, multi-octave noise layering, multiple display modes, interactive 3D view
- **Technologies**: Three.js, Simplex Noise, lil-gui

### 9. 传感器数据仪表盘 (Sensor Dashboard)

- **Path**: `/sensor-dashboard`
- **Features**: Real-time sensor data monitoring dashboard for temperature, humidity, and environmental data
- **Technologies**: ECharts, real-time data visualization

### 10. Conway生命游戏 (Conway's Game of Life)

- **Path**: `/conway-game`
- **Features**: Conway's Game of Life simulator with interactive drawing, automatic evolution, adjustable parameters, play/pause/step controls
- **Technologies**: Canvas API, cellular automaton algorithm, lil-gui
- **Interaction**: Mouse/touch drawing to create/erase cells, random generation, adjustable speed and cell size

### 11. 路径寻找可视化 (Pathfinding Visualization)

- **Path**: `/pathfinding`
- **Features**: Visualize A*, Dijkstra, BFS, DFS pathfinding algorithms, interactive grid editing, maze generation, animation controls
- **Technologies**: Canvas API, pathfinding algorithms, lil-gui
- **Components**: Grid system with composables (useGrid, useAlgorithms, useAnimation, useGUI)

### 12. n8n 流程控制 (n8n Workflow Control)

- **Path**: `/n8n-control`
- **Features**: Trigger n8n webhook workflows from a web interface
- **Technologies**: Webhook integration, workflow automation

## Important Notes

- **Purpose**: This is a sandbox project for demo development and component debugging
- Development server runs on port 3333 with auto-open
- File-based routing means pages in `src/pages/` automatically become routes
- Auto-import system eliminates need for manual imports in most cases
- Git hooks enforce code quality standards
- MCP services available for enhanced capabilities (web search, visual analysis, browser automation)
- Create new demo pages by copying the template structure from existing demo pages
- Each demo page is self-contained with its own components and composables in subdirectories

## Git Commit Guidelines

When committing code changes, follow these guidelines:

1. **Language**: Use Chinese for commit messages
2. **Format**: Follow Conventional Commits specification
3. **Emoji**: Use emojis as visual indicators for commit types
4. **Content**: Do not include Claude-related information (such as "🤖 Generated with [Claude Code](https://claude.com/claude-code)" or "Co-Authored-By: Claude")

### Conventional Commits Format

```
<type>[optional scope]: <emoji> <description>

[optional body]

[optional footer(s)]
```

### Common Types and Emojis

- ✨ `feat`: 新功能
- 🐛 `fix`: 修复bug
- 📝 `docs`: 文档更新
- 🎨 `style`: 代码格式调整
- ♻️ `refactor`: 代码重构
- ⚡ `perf`: 性能优化
- ✅ `test`: 测试相关
- 🔧 `chore`: 构建工具或依赖更新
- 🚀 `deploy`: 部署相关

### Examples

```
feat(raycaster): ✨ 添加鼠标点击事件处理
fix(shadows): 🐛 修复阴影渲染问题
docs(readme): 📝 更新项目说明文档
```

_Note: Emoji usage follows common Git commit conventions_
