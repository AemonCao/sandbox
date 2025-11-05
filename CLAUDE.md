# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 digital twin management platform built with modern tooling. The project serves as a sandbox environment for testing and development of device monitoring, energy management, and smart analysis features.

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
- **Styling**: UnoCSS for atomic CSS with presetWind4 and presetIcons
- **State Management**: Pinia
- **Routing**: File-based routing via unplugin-vue-router
- **UI Library**: Naive UI with auto-import resolvers
- **Data Visualization**: ECharts and ECharts-GL
- **Head Management**: @unhead/vue for meta tags

### Auto-Import System

- Components auto-imported from `src/components/`
- Composables auto-imported from `src/composables/`
- Vue APIs, Vue Router, VueUse, and Naive UI utilities automatically imported
- Type definitions generated automatically
- No manual imports needed for common utilities

### Key Directories

- `src/pages/` - File-based routing (pages become routes automatically)
- `src/layouts/` - Layout components for page structure
- `src/composables/` - Vue composables for reusable logic
- `src/router/` - Router configuration and guards
- `src/styles/` - Global styles and theme configuration
- `src/assets/` - Static assets (fonts, images)

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

- Path alias: `~/` points to `src/` directory
- Environment-specific builds (development, staging, production)
- TypeScript strict mode enabled
- Vue DevTools integration with VS Code launch support

## Development Guidelines

### Catalog-based Dependency Management

- Uses pnpm workspace with catalog-based dependency management
- Dependencies organized in catalogs: `build`, `dev`, `frontend`
- Centralized version management across dependencies

## Important Notes

- Development server runs on port 3333
- File-based routing means pages in `src/pages/` automatically become routes
- Auto-import system eliminates need for manual imports in most cases
- Git hooks enforce code quality standards
- Environment variables configured in `.env.*` files
- Project uses modern Vue 3 ecosystem with latest tooling patterns

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
