#!/usr/bin/env node

/**
 * 构建产物压缩脚本
 *
 * 功能：将Vite构建生成的dist目录压缩为ZIP文件，文件名包含环境信息和时间戳
 * 使用：node scripts/zip-build.js [环境名称]
 * 示例：node scripts/zip-build.js production
 *       或使用环境变量：ZIP_PROJECT_NAME=sdp node scripts/zip-build.js production
 *
 * 依赖：archiver (需要安装)
 * 输出：dist-zip目录下的压缩包文件
 * 配置：可通过环境变量ZIP_PROJECT_NAME设置项目名称
 */

import { createWriteStream } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import archiver from 'archiver'

console.log('🚀 构建产物压缩脚本开始执行...')

/**
 * 创建ZIP压缩包
 * @param {string} sourceDir - 要压缩的源目录路径
 * @param {string} zipPath - 压缩包输出路径
 * @returns {Promise<void>}
 */
async function createZip(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    // 创建输出文件流
    const output = createWriteStream(zipPath)

    // 创建archiver实例，使用最高压缩级别
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 9为最高压缩级别
    })

    // 压缩完成事件监听
    output.on('close', () => {
      console.log(`✅ 压缩包创建成功: ${zipPath}`)
      console.log(`📦 压缩包大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
      resolve()
    })

    // 压缩错误事件监听
    archive.on('error', (err) => {
      reject(err)
    })

    // 将压缩流管道连接到输出文件流
    archive.pipe(output)

    /**
     * 递归添加目录中的所有文件到压缩包
     * @param {string} dir - 当前处理的目录路径
     * @param {string} archivePath - 在压缩包中的相对路径
     */
    async function addDirectoryToArchive(dir, archivePath = '') {
      // 读取目录中的所有文件和子目录
      const files = await readdir(dir)

      // 遍历所有文件和子目录
      for (const file of files) {
        const fullPath = join(dir, file)
        const fileStat = await stat(fullPath)
        const relativePath = join(archivePath, file)

        if (fileStat.isDirectory()) {
          // 如果是目录，递归处理
          await addDirectoryToArchive(fullPath, relativePath)
        }
        else {
          // 如果是文件，添加到压缩包
          archive.file(fullPath, { name: relativePath })
        }
      }
    }

    // 开始递归添加文件，完成后结束压缩
    addDirectoryToArchive(sourceDir)
      .then(() => archive.finalize())
      .catch(reject)
  })
}

/**
 * 主函数 - 脚本的主要执行逻辑
 */
async function main() {
  try {
    // 获取命令行参数，默认为production环境
    const env = process.argv[2] || 'production'

    // 从package.json读取项目名称
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

    // 项目名称配置：优先级：环境变量 ZIP_PROJECT_NAME > package.json name > 默认值 'dist'
    const projectName = process.env.ZIP_PROJECT_NAME || packageJson.name || 'dist'

    // 生成格式化的时间戳：YYYYMMDD_HHmmss
    const now = new Date()
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    // 定义路径
    const buildDir = join(process.cwd(), 'dist') // 构建输出目录
    const zipFileName = `${projectName}_${env}_${timestamp}.zip` // 压缩包文件名
    const zipPath = join(process.cwd(), 'dist-zip', zipFileName) // 压缩包完整路径

    // 输出执行信息
    console.log(`📁 项目名称: ${projectName}`)
    console.log(`🌍 环境: ${env}`)
    console.log(`⏰ 时间戳: ${timestamp}`)
    console.log(`📦 压缩包名称: ${zipFileName}`)
    console.log(`📂 源目录: ${buildDir}`)
    console.log(`💾 输出路径: ${zipPath}`)

    // 检查dist目录是否存在
    try {
      await stat(buildDir)
    }
    catch {
      console.error(`❌ 错误: dist目录不存在，请先运行构建命令`)
      console.error(`💡 提示: 运行 pnpm build:${env} 生成dist目录`)
      process.exit(1)
    }

    // 创建dist-zip目录（如果不存在）
    const distZipDir = join(process.cwd(), 'dist-zip')
    try {
      await stat(distZipDir)
    }
    catch {
      console.log(`📁 创建dist-zip目录...`)
      const { mkdir } = await import('node:fs/promises')
      await mkdir(distZipDir, { recursive: true })
    }

    // 创建压缩包
    console.log(`🗜️  正在创建压缩包...`)
    await createZip(buildDir, zipPath)

    console.log(`🎉 压缩包创建完成！`)
    console.log(`📋 文件路径: ${zipPath}`)
  }
  catch (error) {
    console.error(`❌ 创建压缩包时出错:`, error.message)
    process.exit(1)
  }
}

// 直接调用main函数
main()
