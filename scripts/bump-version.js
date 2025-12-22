import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

/**
 * 自动递增版本号并生成 CHANGELOG
 * 在 pre-commit hook 中执行
 */

// 获取暂存区的文件列表
const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
if (!stagedFiles.trim()) {
  console.log('No staged files, skipping version bump')
  process.exit(0)
}

// 读取 package.json
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)

// 递增补丁版本号
pkg.version = `${major}.${minor}.${patch + 1}`

// 写回 package.json
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

console.log(`Version bumped: ${major}.${minor}.${patch} → ${pkg.version}`)

// 生成 CHANGELOG
try {
  execSync('npx conventional-changelog -p angular -i CHANGELOG.md -s', { stdio: 'inherit' })
  console.log('CHANGELOG.md updated')
}
catch (error) {
  console.error('Failed to generate CHANGELOG:', error.message)
  process.exit(1)
}

// 将 package.json 和 CHANGELOG.md 添加到暂存区
execSync('git add package.json CHANGELOG.md')
console.log('Added package.json and CHANGELOG.md to staging area')
