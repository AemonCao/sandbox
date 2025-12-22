# 构建产物压缩脚本

## 概述

`zip-build.js` 是一个用于将Vite构建生成的`dist`目录压缩为ZIP文件的Node.js脚本。压缩包文件名包含环境信息和时间戳，便于版本管理和部署。

## 功能特性

- ✅ 将`dist`目录递归压缩为ZIP文件
- ✅ 文件名自动包含环境名称和时间戳
- ✅ 最高级别压缩（zlib level 9）
- ✅ 自动创建输出目录（dist-zip）
- ✅ 详细的执行日志输出
- ✅ 错误处理和友好的提示信息

## 安装依赖

脚本依赖 `archiver` 包，请确保已安装：

```bash
pnpm add -D archiver
# 或
npm install --save-dev archiver
```

## 使用方法

### 基本用法

```bash
# 默认使用production环境
node scripts/zip-build.js

# 指定环境
node scripts/zip-build.js staging
node scripts/zip-build.js production
node scripts/zip-build.js aliyun
```

### 与构建命令结合使用

```bash
# 先构建，后压缩
pnpm build:production
ZIP_PROJECT_NAME=sdp node scripts/zip-build.js production

# 或使用项目预定义的npm scripts（推荐）
pnpm build:production:zip  # 构建production环境并压缩
pnpm build:staging:zip     # 构建staging环境并压缩
pnpm zip                   # 仅压缩当前dist目录
```

### 输出示例

```
🚀 构建产物压缩脚本开始执行...
📁 项目名称: sdp
🌍 环境: production
⏰ 时间戳: 20251203_143025
📦 压缩包名称: sdp_production_20251203_143025.zip
📂 源目录: /path/to/project/dist
💾 输出路径: /path/to/project/dist-zip/sdp_production_20251203_143025.zip
🗜️  正在创建压缩包...
✅ 压缩包创建成功: /path/to/project/dist-zip/sdp_production_20251203_143025.zip
📦 压缩包大小: 12.34 MB
🎉 压缩包创建完成！
📋 文件路径: /path/to/project/dist-zip/sdp_production_20251203_143025.zip
```

## 文件名格式

压缩包文件名格式为：

```
{项目名称}_{环境}_{时间戳}.zip
```

例如：

```
sdp_production_20251203_143025.zip
sdp_staging_20251203_143025.zip
```

时间戳格式：`YYYYMMDD_HHmmss`

## 项目配置

### 项目名称配置

项目名称按以下优先级自动获取：

1. **环境变量 `ZIP_PROJECT_NAME`**（最高优先级）
2. **`package.json` 的 `name` 字段**（推荐，自动读取）
3. **默认值 `dist`**（兜底方案）

#### 方式1：使用 package.json（推荐）

脚本会自动读取 `package.json` 中的 `name` 字段作为项目名称，无需额外配置：

```json
{
  "name": "sdp"
}
```

#### 方式2：使用环境变量

通过环境变量动态覆盖项目名称：

```bash
# Linux/macOS
export ZIP_PROJECT_NAME="spatial-digital-platform"
node scripts/zip-build.js production

# Windows (Command Prompt)
set ZIP_PROJECT_NAME=spatial-digital-platform
node scripts/zip-build.js production

# Windows (PowerShell)
$env:ZIP_PROJECT_NAME="spatial-digital-platform"
node scripts/zip-build.js production
```

#### 方式3：在 package.json scripts 中配置

```json
{
  "scripts": {
    "zip:production": "ZIP_PROJECT_NAME=spatial-digital-platform node scripts/zip-build.js production"
  }
}
```

### 自定义输出目录

默认输出目录为 `dist-zip`，可以在脚本中修改：

```javascript
const zipPath = join(process.cwd(), 'dist-zip', zipFileName) // 修改此路径
```

## 集成到package.json

建议将压缩脚本集成到package.json的scripts中：

```json
{
  "scripts": {
    "build:production": "vite build --mode production",
    "build:staging": "vite build --mode staging",
    "build:aliyun": "vite build --mode aliyun",
    "zip:production": "node scripts/zip-build.js production",
    "zip:staging": "node scripts/zip-build.js staging",
    "zip:aliyun": "node scripts/zip-build.js aliyun",
    "build:zip:production": "pnpm build:production && pnpm zip:production",
    "build:zip:staging": "pnpm build:staging && pnpm zip:staging",
    "build:zip:aliyun": "pnpm build:aliyun && pnpm zip:aliyun"
  }
}
```

## 错误处理

脚本包含以下错误处理：

1. **dist目录不存在**：提示用户先运行构建命令
2. **压缩过程错误**：输出错误信息并退出
3. **输出目录创建失败**：尝试创建目录，失败则退出

## 脚本结构

```
zip-build.js
├── 文件头部注释（功能说明、使用方法）
├── 导入依赖模块
├── createZip() - 创建压缩包的核心函数
│   ├── 创建文件输出流
│   ├── 配置archiver压缩器
│   ├── 事件监听（完成、错误）
│   └── 递归添加目录文件的辅助函数
├── main() - 主执行函数
│   ├── 解析命令行参数
│   ├── 生成时间戳
│   ├── 构建文件路径
│   ├── 检查dist目录
│   ├── 创建输出目录
│   └── 调用createZip()
└── 调用main()启动脚本
```

## 注意事项

1. **依赖检查**：确保已安装`archiver`包
2. **构建前置**：运行压缩脚本前需要先构建项目生成`dist`目录
3. **文件权限**：确保脚本有权限读取`dist`目录和写入`dist-zip`目录
4. **项目名称**：根据实际项目修改`projectName`变量
5. **环境变量**：脚本不处理环境变量，依赖构建命令设置正确的环境

## 扩展建议

### 1. 添加排除文件功能

可以扩展脚本以支持排除特定文件或目录：

```javascript
const excludePatterns = ['node_modules', '.git', '*.log']
```

### 2. 支持配置文件

可以创建配置文件（如`zip-config.json`）来管理：

- 项目名称
- 排除规则
- 压缩级别
- 输出目录

### 3. 添加清理功能

添加清理旧压缩包的功能：

```javascript
// 保留最近N个压缩包，删除旧的
function cleanupOldZips(maxFiles = 10) {
  // ...
}
```

### 4. 集成到CI/CD

可以将此脚本集成到GitHub Actions、GitLab CI等持续集成流程中。

## 许可证

此脚本为项目内部工具，遵循项目整体许可证。
