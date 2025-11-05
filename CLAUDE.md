# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a Vitesse Lite Vue 3 project using pnpm as the package manager.

- `pnpm dev` - Start development server on port 3333 and open browser
- `pnpm build` - Build for production using Vite
- `pnpm build:prod` - Build for production environment
- `pnpm build:staging` - Build for staging environment
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking with vue-tsc
- `pnpm test` - Run Vitest tests
- `pnpm up` - Update dependencies with taze

## Project Architecture

### Framework & Tooling

- **Vue 3** with Composition API and `<script setup>` syntax
- **Vite** as build tool with hot module replacement
- **TypeScript** with strict configuration
- **UnoCSS** for atomic CSS with predefined shortcuts and presets
- **File-based routing** via `unplugin-vue-router`
- **Naive UI** as component library with Chinese localization
- **ECharts** for data visualization and charts
- **Pinia** for state management
- **VueUse** for utility composition functions

### Auto-import System

- **Components**: Auto-imported from `src/components/` (no manual imports needed)
- **Composables**: Auto-imported from `src/composables/`
- **Vue APIs**: Auto-imported (ref, computed, watch, etc.)
- **Vue Router**: Auto-imported (useRouter, useRoute, etc.)
- **VueUse**: Auto-imported utilities
- **Naive UI**: Auto-imported utilities (useDialog, useMessage, useNotification, useLoadingBar)
- **Pinia**: Auto-imported (defineStore, storeToRefs)

### Key Configuration Files

- `vite.config.ts` - Vite configuration with UnoCSS and auto-import plugins
- `uno.config.ts` - UnoCSS configuration with presets and shortcuts
- `eslint.config.js` - ESLint configuration using @antfu/eslint-config
- `tsconfig.json` - TypeScript configuration with path alias `~/` for `src/`

### Project Structure

- `src/pages/` - File-based routes (each .vue file becomes a route)
- `src/components/` - Reusable Vue components (auto-imported)
- `src/composables/` - Vue composition functions (auto-imported)
- `src/styles/` - Global CSS styles
- `public/` - Static assets

### Development Features

- **Git hooks** with simple-git-hooks for pre-commit linting
- **VS Code** configuration with recommended extensions and ESLint integration
- **Netlify** deployment configuration in `netlify.toml`
- **Testing** with Vitest and Vue Test Utils

When working with components, use the `~/` alias for imports from the `src/` directory. Components and composables are automatically imported, so explicit imports are not needed.

## Digital Twin Platform Features

This is a digital twin management platform with the following core modules:

- **Device Monitoring** (`/device-monitor`) - Building equipment monitoring and management
- **Energy Management** (`/energy-management`) - Energy consumption analysis and optimization
- **Maintenance** (`/maintenance`) - Equipment maintenance and scheduling
- **Smart Analysis** (`/smart-analysis`) - Data analytics and insights

### ECharts Integration

The platform includes a custom `useEcharts` composable for data visualization:

- Located in `src/composables/useEcharts.ts`
- Automatically handles theme switching (light/dark mode)
- Responsive chart resizing
- Proper cleanup on component unmount

### UI Framework

- **Naive UI** with Chinese localization (`zhCN`)
- Dark theme support via `isDark` composable
- Responsive design with UnoCSS utilities

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
