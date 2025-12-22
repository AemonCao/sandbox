import type { ColorScheme, ColorStop, NoiseParams, TerrainParams } from './types'
import * as THREE from 'three'
import { useSimplexNoise } from './useSimplexNoise'

/**
 * 地形生成器
 */
export function useTerrainGenerator() {
  const { generateNoise } = useSimplexNoise()

  /**
   * 地形颜色映射 - Minecraft风格
   */
  const terrainColorStops: ColorStop[] = [
    { height: 0.0, color: '#1a4d7a' }, // 深水
    { height: 0.3, color: '#2e8bc0' }, // 浅水
    { height: 0.4, color: '#f4e7c3' }, // 沙滩
    { height: 0.45, color: '#5a9a3c' }, // 草地
    { height: 0.6, color: '#8b7355' }, // 山地
    { height: 0.75, color: '#ffffff' }, // 雪山
  ]

  /**
   * 热力图颜色映射
   */
  const heatmapColorStops: ColorStop[] = [
    { height: 0.0, color: '#000080' }, // 深蓝
    { height: 0.25, color: '#0000ff' }, // 蓝色
    { height: 0.5, color: '#00ff00' }, // 绿色
    { height: 0.75, color: '#ffff00' }, // 黄色
    { height: 1.0, color: '#ff0000' }, // 红色
  ]

  /**
   * 根据高度获取颜色
   * @param height - 高度值 (0-1)
   * @param colorScheme - 颜色方案
   * @returns THREE.Color对象
   */
  function getColorForHeight(height: number, colorScheme: ColorScheme): THREE.Color {
    const stops = colorScheme === 'terrain' ? terrainColorStops : heatmapColorStops

    // 找到对应的颜色区间
    for (let i = 0; i < stops.length - 1; i++) {
      if (height >= stops[i].height && height < stops[i + 1].height) {
        // 线性插值
        const t = (height - stops[i].height) / (stops[i + 1].height - stops[i].height)
        const color1 = new THREE.Color(stops[i].color)
        const color2 = new THREE.Color(stops[i + 1].color)
        return color1.lerp(color2, t)
      }
    }

    // 超出范围使用最后一个颜色
    return new THREE.Color(stops[stops.length - 1].color)
  }

  /**
   * 生成地形网格
   * @param noiseParams - 噪声参数
   * @param terrainParams - 地形参数
   * @param colorScheme - 颜色方案
   * @returns THREE.Mesh对象
   */
  function generateTerrain(
    noiseParams: NoiseParams,
    terrainParams: TerrainParams,
    colorScheme: ColorScheme,
  ): THREE.Mesh {
    const { width, height, segments, heightScale } = terrainParams

    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(width, height, segments, segments)

    // 获取顶点位置和颜色数组
    const positions = geometry.attributes.position.array as Float32Array
    const colors = new Float32Array(positions.length)

    // 生成高度图和颜色
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 1]

      // 归一化坐标
      const nx = (x + width / 2) / width
      const nz = (z + height / 2) / height

      // 生成噪声值
      const elevation = generateNoise(nx, nz, noiseParams)

      // 设置高度
      positions[i + 2] = elevation * heightScale

      // 设置颜色
      const color = getColorForHeight(elevation, colorScheme)
      colors[i] = color.r
      colors[i + 1] = color.g
      colors[i + 2] = color.b
    }

    // 更新几何体
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()

    // 添加颜色属性
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // 创建材质
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
    })

    // 创建网格
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2 // 旋转使其水平

    return mesh
  }

  return {
    generateTerrain,
  }
}
