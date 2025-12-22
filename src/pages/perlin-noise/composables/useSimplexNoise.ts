import type { NoiseParams } from './types'

/**
 * Simplex噪声生成器
 * 基于Ken Perlin的改进算法(2001)
 */
export function useSimplexNoise() {
  // 梯度向量
  const grad3 = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ]

  // 置换表
  let perm: number[] = []

  /**
   * 初始化置换表
   * @param seed - 随机种子
   */
  function initPermutation(seed: number) {
    const p = Array.from({ length: 256 }, (_, i) => i)

    // 使用种子初始化随机数生成器
    let random = seed
    function seededRandom() {
      random = (random * 9301 + 49297) % 233280
      return random / 233280
    }

    // Fisher-Yates洗牌算法
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]]
    }

    // 扩展置换表
    perm = [...p, ...p]
  }

  /**
   * 计算点积
   */
  function dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y
  }

  /**
   * 2D Simplex噪声核心算法
   * @param xin - x坐标
   * @param yin - y坐标
   * @returns 噪声值 (-1 到 1)
   */
  function noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0)
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0

    // 倾斜输入空间
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)

    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = xin - X0
    const y0 = yin - Y0

    // 确定单纯形
    let i1, j1
    if (x0 > y0) {
      i1 = 1
      j1 = 0
    }
    else {
      i1 = 0
      j1 = 1
    }

    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1.0 + 2.0 * G2
    const y2 = y0 - 1.0 + 2.0 * G2

    // 计算梯度索引
    const ii = i & 255
    const jj = j & 255
    const gi0 = perm[ii + perm[jj]] % 12
    const gi1 = perm[ii + i1 + perm[jj + j1]] % 12
    const gi2 = perm[ii + 1 + perm[jj + 1]] % 12

    // 计算每个角的贡献
    let n0, n1, n2

    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 < 0) {
      n0 = 0.0
    }
    else {
      t0 *= t0
      n0 = t0 * t0 * dot(grad3[gi0], x0, y0)
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 < 0) {
      n1 = 0.0
    }
    else {
      t1 *= t1
      n1 = t1 * t1 * dot(grad3[gi1], x1, y1)
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 < 0) {
      n2 = 0.0
    }
    else {
      t2 *= t2
      n2 = t2 * t2 * dot(grad3[gi2], x2, y2)
    }

    // 缩放到[-1, 1]
    return 70.0 * (n0 + n1 + n2)
  }

  /**
   * 多八度噪声生成
   * @param x - x坐标
   * @param y - y坐标
   * @param params - 噪声参数
   * @returns 噪声值 (0 到 1)
   */
  function generateNoise(x: number, y: number, params: NoiseParams): number {
    initPermutation(params.seed)

    let amplitude = 1.0
    let frequency = params.scale
    let noiseValue = 0.0
    let maxValue = 0.0

    // 叠加多个八度
    for (let i = 0; i < params.octaves; i++) {
      const sampleX = x * frequency
      const sampleY = y * frequency

      noiseValue += noise2D(sampleX, sampleY) * amplitude

      maxValue += amplitude
      amplitude *= params.persistence
      frequency *= params.lacunarity
    }

    // 归一化到[0, 1]
    return (noiseValue / maxValue + 1.0) / 2.0
  }

  return {
    generateNoise,
  }
}
