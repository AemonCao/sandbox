<script setup lang="ts">
import type { ColorScheme, DisplayMode, NoiseParams, TerrainParams, VisualParams } from './composables/types'
import GUI from 'lil-gui'
import TerrainCanvas from './components/TerrainCanvas.vue'

// 噪声参数
const noiseParams = reactive<NoiseParams>({
  seed: 1000,
  scale: 0.1,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
})

// 地形参数
const terrainParams = reactive<TerrainParams>({
  width: 100,
  height: 100,
  segments: 100,
  heightScale: 30,
})

// 视觉参数
const visualParams = reactive<VisualParams>({
  displayMode: 'solid',
  colorScheme: 'terrain',
})

let gui: GUI | null = null

/**
 * 初始化GUI控制面板
 */
function initGUI() {
  gui = new GUI({ title: 'Perlin噪声地图生成器' })

  // 噪声参数组
  const noiseFolder = gui.addFolder('噪声参数')
  noiseFolder.add(noiseParams, 'seed', 0, 10000, 1).name('随机种子')
  noiseFolder.add(noiseParams, 'scale', 0.01, 0.5, 0.01).name('缩放比例')
  noiseFolder.add(noiseParams, 'octaves', 1, 8, 1).name('八度数量')
  noiseFolder.add(noiseParams, 'persistence', 0.1, 1.0, 0.1).name('持续度')
  noiseFolder.add(noiseParams, 'lacunarity', 1.5, 3.0, 0.1).name('间隙度')
  noiseFolder.open()

  // 地形参数组
  const terrainFolder = gui.addFolder('地形参数')
  terrainFolder.add(terrainParams, 'width', 50, 200, 10).name('地图宽度')
  terrainFolder.add(terrainParams, 'height', 50, 200, 10).name('地图高度')
  terrainFolder.add(terrainParams, 'segments', 50, 200, 10).name('网格细分')
  terrainFolder.add(terrainParams, 'heightScale', 10, 50, 5).name('高度缩放')
  terrainFolder.open()

  // 视觉参数组
  const visualFolder = gui.addFolder('视觉选项')
  visualFolder.add(visualParams, 'displayMode', ['solid', 'wireframe', 'both'] as DisplayMode[]).name('显示模式')
  visualFolder.add(visualParams, 'colorScheme', ['terrain', 'heatmap'] as ColorScheme[]).name('颜色方案')
  visualFolder.open()

  // 操作按钮
  const actions = {
    randomSeed: () => {
      noiseParams.seed = Math.floor(Math.random() * 10000)
    },
    reset: () => {
      noiseParams.seed = 1000
      noiseParams.scale = 0.1
      noiseParams.octaves = 4
      noiseParams.persistence = 0.5
      noiseParams.lacunarity = 2.0
      terrainParams.width = 100
      terrainParams.height = 100
      terrainParams.segments = 100
      terrainParams.heightScale = 30
      visualParams.displayMode = 'solid'
      visualParams.colorScheme = 'terrain'
      gui?.controllersRecursive().forEach(c => c.updateDisplay())
    },
  }

  gui.add(actions, 'randomSeed').name('🎲 随机种子')
  gui.add(actions, 'reset').name('🔄 重置参数')
}

onMounted(() => {
  initGUI()
})

onUnmounted(() => {
  gui?.destroy()
})
</script>

<template>
  <div h-screen w-full from-gray-50 to-gray-100 bg-gradient-to-br dark:from-gray-900 dark:to-gray-800>
    <!-- 标题栏 -->
    <div p-6 pointer-events-none left-0 right-0 top-0 absolute z-10>
      <div mx-auto max-w-4xl>
        <h1 text-3xl text-gray-800 font-bold mb-2 dark:text-white>
          Perlin噪声地图生成器
        </h1>
        <p text-sm text-gray-600 dark:text-gray-300>
          使用Simplex噪声算法生成类似Minecraft的程序化3D地形 | 鼠标拖拽旋转 | 滚轮缩放
        </p>
      </div>
    </div>

    <!-- 3D渲染区域 -->
    <div h-full w-full>
      <TerrainCanvas
        :noise-params="noiseParams"
        :terrain-params="terrainParams"
        :visual-params="visualParams"
      />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: 'Perlin 噪声地图生成器'
  description: '使用 Simplex 噪声算法生成类似 Minecraft 的程序化 3D 地形，支持多种显示模式和颜色方案'
</route>
