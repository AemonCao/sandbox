import { computed, ref } from 'vue'

// 算法类型定义
export interface Beacon {
  id: string
  x: number
  y: number
  txPower: number
  n: number
}

export interface TestPoint {
  id: string
  x: number
  y: number
  rssi: Record<string, number>
}

export interface Position {
  x: number
  y: number
}

export interface AlgorithmResult {
  algorithm: string
  position: Position
  error: number
  executionTime: number
  confidence: number
  metadata?: any
}

export interface ComparisonResults {
  totalTests: number
  algorithms: Record<string, {
    averageError: number
    maxError: number
    minError: number
    standardDeviation: number
    averageTime: number
    successRate: number
  }>
  bestAccuracy: {
    algorithm: string
    error: number
  }
  bestPerformance: {
    algorithm: string
    time: number
  }
  averageAccuracy: number
  standardDeviation: number
}

/**
 * 提供多算法定位引擎对比功能
 *
 * @param {any} beacons 信标数组
 * @param {any} testPoints 测试点数组
 * @param {any} truePositions 真实位置数组
 * @param {any} algorithmResults 算法结果对象
 * @return {object} 对比分析功能集合
 */
export function useAlgorithmComparison(
  beacons: any,
  testPoints: any,
  truePositions: any,
  algorithmResults: any,
) {
  const isCalculating = ref(false)
  const comparisonResults = ref<ComparisonResults | null>(null)

  // 算法信息
  const algorithmInfo = computed(() => ({
    trilateration: {
      name: '三角定位',
      description: '基于三个或更多信标的信号强度计算距离，通过圆交点确定位置',
      advantages: ['计算简单', '实时性好', '精度较高'],
      disadvantages: ['需要至少3个信标', '信号衰减影响大', '多径效应敏感'],
    },
    fingerprinting: {
      name: '指纹定位',
      description: '基于预先构建的RSSI指纹数据库进行位置匹配',
      advantages: ['精度高', '抗干扰能力强', '适应复杂环境'],
      disadvantages: ['需要离线训练', '环境变化敏感', '工作量大'],
    },
    centroid: {
      name: '质心算法',
      description: '计算所有可见信标的质心作为估计位置',
      advantages: ['实现简单', '计算量小', '稳定性好'],
      disadvantages: ['精度较低', '对信标布局敏感', '不考虑信号强度'],
    },
    weightedCentroid: {
      name: '加权质心算法',
      description: '根据信号强度对信标位置进行加权平均',
      advantages: ['比质心算法精确', '计算效率高', '实现简单'],
      disadvantages: ['权重选择影响大', '信号波动敏感', '精度有限'],
    },
    kalmanFilter: {
      name: '卡尔曼滤波',
      description: '利用状态空间模型和观测数据进行递推滤波估计',
      advantages: ['精度高', '抗噪声能力强', '适合动态跟踪'],
      disadvantages: ['模型复杂', '参数调优困难', '计算量大'],
    },
    particleFilter: {
      name: '粒子滤波',
      description: '基于蒙特卡罗方法的贝叶斯滤波算法',
      advantages: ['非线性非高斯适用', '精度很高', '鲁棒性强'],
      disadvantages: ['计算复杂', '粒子数量影响大', '参数调节敏感'],
    },
  }))

  // 精度指标
  const accuracyMetrics = computed(() => {
    if (!comparisonResults.value)
      return null

    const results = comparisonResults.value.algorithms
    return Object.entries(results).map(([algorithm, metrics]) => ({
      algorithm,
      name: algorithmInfo.value[algorithm].name,
      ...metrics,
    })).sort((a, b) => a.averageError - b.averageError)
  })

  /**
   * 三角定位算法实现
   *
   * @param {Beacon[]} beacons 信标数组
   * @param {Record<string, number>} rssiData RSSI数据映射
   * @return {AlgorithmResult} 算法执行结果
   */
  function trilateration(beacons: Beacon[], rssiData: Record<string, number>): AlgorithmResult {
    const startTime = performance.now()

    // 过滤有效信标
    const validBeacons = beacons.filter(beacon =>
      rssiData[beacon.id] !== undefined && rssiData[beacon.id] > -100,
    )

    if (validBeacons.length < 3) {
      return {
        algorithm: 'trilateration',
        position: { x: 0, y: 0 },
        error: Infinity,
        executionTime: performance.now() - startTime,
        confidence: 0,
      }
    }

    // 使用前3个最强的信标进行计算
    const topBeacons = validBeacons
      .sort((a, b) => rssiData[b.id] - rssiData[a.id])
      .slice(0, 3)

    try {
      // 计算距离
      const distances = topBeacons.map((beacon) => {
        const distance = calculateDistance(rssiData[beacon.id], beacon.txPower, beacon.n)
        return { beacon, distance }
      })

      // 使用最小二乘法求解位置
      const position = leastSquaresTrilateration(distances)

      return {
        algorithm: 'trilateration',
        position,
        error: 0, // 将在外部计算
        executionTime: performance.now() - startTime,
        confidence: calculateConfidence(distances),
      }
    }
    catch {
      return {
        algorithm: 'trilateration',
        position: { x: 0, y: 0 },
        error: Infinity,
        executionTime: performance.now() - startTime,
        confidence: 0,
      }
    }
  }

  /**
   * 指纹定位算法实现
   *
   * @param {TestPoint} testPoint 测试点
   * @param {Array<{x: number, y: number, rssi: Record<string, number>}>} fingerprintDB 指纹数据库
   * @return {AlgorithmResult} 算法执行结果
   */
  function fingerprinting(testPoint: TestPoint, fingerprintDB: Array<{ x: number, y: number, rssi: Record<string, number> }>): AlgorithmResult {
    const startTime = performance.now()

    // 计算与每个指纹点的相似度
    const similarities = fingerprintDB.map((fp) => {
      let distance = 0
      let commonBeacons = 0

      for (const beaconId in testPoint.rssi) {
        if (fp.rssi[beaconId] !== undefined) {
          distance += (testPoint.rssi[beaconId] - fp.rssi[beaconId]) ** 2
          commonBeacons++
        }
      }

      return {
        fingerprint: fp,
        distance: commonBeacons > 0 ? distance / commonBeacons : Infinity,
      }
    }).sort((a, b) => a.distance - b.distance)

    // 使用K近邻方法
    const k = 3
    const kNearest = similarities.slice(0, Math.min(k, similarities.length))

    if (kNearest.length === 0) {
      return {
        algorithm: 'fingerprinting',
        position: { x: 0, y: 0 },
        error: Infinity,
        executionTime: performance.now() - startTime,
        confidence: 0,
      }
    }

    // 加权平均计算位置
    let totalWeight = 0
    let weightedX = 0
    let weightedY = 0

    kNearest.forEach(({ fingerprint, distance }) => {
      const weight = 1 / (distance + 0.001) // 避免除零
      weightedX += fingerprint.x * weight
      weightedY += fingerprint.y * weight
      totalWeight += weight
    })

    const position = {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
    }

    return {
      algorithm: 'fingerprinting',
      position,
      error: 0,
      executionTime: performance.now() - startTime,
      confidence: Math.max(0, 100 - kNearest[0].distance),
    }
  }

  /**
   * 质心算法实现
   *
   * @param {Beacon[]} beacons 信标数组
   * @param {Record<string, number>} rssiData RSSI数据映射
   * @return {AlgorithmResult} 算法执行结果
   */
  function centroid(beacons: Beacon[], rssiData: Record<string, number>): AlgorithmResult {
    const startTime = performance.now()

    const visibleBeacons = beacons.filter(beacon =>
      rssiData[beacon.id] !== undefined && rssiData[beacon.id] > -100,
    )

    if (visibleBeacons.length === 0) {
      return {
        algorithm: 'centroid',
        position: { x: 0, y: 0 },
        error: Infinity,
        executionTime: performance.now() - startTime,
        confidence: 0,
      }
    }

    const centroidX = visibleBeacons.reduce((sum, beacon) => sum + beacon.x, 0) / visibleBeacons.length
    const centroidY = visibleBeacons.reduce((sum, beacon) => sum + beacon.y, 0) / visibleBeacons.length

    return {
      algorithm: 'centroid',
      position: { x: centroidX, y: centroidY },
      error: 0,
      executionTime: performance.now() - startTime,
      confidence: Math.min(100, visibleBeacons.length * 20),
    }
  }

  /**
   * 加权质心算法实现
   *
   * @param {Beacon[]} beacons 信标数组
   * @param {Record<string, number>} rssiData RSSI数据映射
   * @param {number} signalPower 信号功率参数
   * @return {AlgorithmResult} 算法执行结果
   */
  function weightedCentroid(beacons: Beacon[], rssiData: Record<string, number>, signalPower: number = 2.0): AlgorithmResult {
    const startTime = performance.now()

    const visibleBeacons = beacons.filter(beacon =>
      rssiData[beacon.id] !== undefined && rssiData[beacon.id] > -100,
    )

    if (visibleBeacons.length === 0) {
      return {
        algorithm: 'weightedCentroid',
        position: { x: 0, y: 0 },
        error: Infinity,
        executionTime: performance.now() - startTime,
        confidence: 0,
      }
    }

    let totalWeight = 0
    let weightedX = 0
    let weightedY = 0

    visibleBeacons.forEach((beacon) => {
      const weight = (rssiData[beacon.id] + 100) ** signalPower
      weightedX += beacon.x * weight
      weightedY += beacon.y * weight
      totalWeight += weight
    })

    const position = {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
    }

    return {
      algorithm: 'weightedCentroid',
      position,
      error: 0,
      executionTime: performance.now() - startTime,
      confidence: Math.min(100, visibleBeacons.length * 25),
    }
  }

  /**
   * 卡尔曼滤波算法实现
   *
   * @param {Position[]} measurements 测量位置数组
   * @param {number} processNoise 过程噪声
   * @param {number} measurementNoise 测量噪声
   * @return {AlgorithmResult} 算法执行结果
   */
  function kalmanFilter(measurements: Position[], processNoise: number = 0.1, measurementNoise: number = 1.0): AlgorithmResult {
    const startTime = performance.now()

    if (measurements.length === 0) {
      return {
        algorithm: 'kalmanFilter',
        position: { x: 0, y: 0 },
        error: Infinity,
        executionTime: performance.now() - startTime,
        confidence: 0,
      }
    }

    // 初始状态
    let state = measurements[0]
    let covariance = [[1, 0], [0, 1]] // 初始协方差矩阵

    // 状态转移矩阵（假设静止或匀速运动）
    const F = [[1, 0], [0, 1]]

    // 观测矩阵
    const H = [[1, 0], [0, 1]]

    // 过程噪声协方差
    const Q = [[processNoise, 0], [0, processNoise]]

    // 观测噪声协方差
    const R = [[measurementNoise, 0], [0, measurementNoise]]

    measurements.forEach((measurement) => {
      // 预测步骤
      state = {
        x: F[0][0] * state.x + F[0][1] * state.y,
        y: F[1][0] * state.x + F[1][1] * state.y,
      }

      covariance = [
        [
          F[0][0] * covariance[0][0] + F[0][1] * covariance[1][0] + Q[0][0],
          F[0][0] * covariance[0][1] + F[0][1] * covariance[1][1] + Q[0][1],
        ],
        [
          F[1][0] * covariance[0][0] + F[1][1] * covariance[1][0] + Q[1][0],
          F[1][0] * covariance[0][1] + F[1][1] * covariance[1][1] + Q[1][1],
        ],
      ]

      // 更新步骤
      const innovation = {
        x: measurement.x - (H[0][0] * state.x + H[0][1] * state.y),
        y: measurement.y - (H[1][0] * state.x + H[1][1] * state.y),
      }

      const innovationCovariance = [
        [
          H[0][0] * covariance[0][0] + H[0][1] * covariance[1][0] + R[0][0],
          H[0][0] * covariance[0][1] + H[0][1] * covariance[1][1] + R[0][1],
        ],
        [
          H[1][0] * covariance[0][0] + H[1][1] * covariance[1][0] + R[1][0],
          H[1][0] * covariance[0][1] + H[1][1] * covariance[1][1] + R[1][1],
        ],
      ]

      const kalmanGain = [
        [
          (covariance[0][0] * innovationCovariance[1][1] - covariance[0][1] * innovationCovariance[1][0])
          / (innovationCovariance[0][0] * innovationCovariance[1][1] - innovationCovariance[0][1] * innovationCovariance[1][0]),
          (covariance[0][1] * innovationCovariance[0][0] - covariance[0][0] * innovationCovariance[0][1])
          / (innovationCovariance[0][0] * innovationCovariance[1][1] - innovationCovariance[0][1] * innovationCovariance[1][0]),
        ],
        [
          (covariance[1][0] * innovationCovariance[1][1] - covariance[1][1] * innovationCovariance[1][0])
          / (innovationCovariance[0][0] * innovationCovariance[1][1] - innovationCovariance[0][1] * innovationCovariance[1][0]),
          (covariance[1][1] * innovationCovariance[0][0] - covariance[1][0] * innovationCovariance[0][1])
          / (innovationCovariance[0][0] * innovationCovariance[1][1] - innovationCovariance[0][1] * innovationCovariance[1][0]),
        ],
      ]

      state = {
        x: state.x + kalmanGain[0][0] * innovation.x + kalmanGain[0][1] * innovation.y,
        y: state.y + kalmanGain[1][0] * innovation.x + kalmanGain[1][1] * innovation.y,
      }

      covariance = [
        [
          (1 - kalmanGain[0][0] * H[0][0] - kalmanGain[0][1] * H[1][0]) * covariance[0][0]
          + (-kalmanGain[0][0] * H[0][1] - kalmanGain[0][1] * H[1][1]) * covariance[1][0],
          (1 - kalmanGain[0][0] * H[0][0] - kalmanGain[0][1] * H[1][0]) * covariance[0][1]
          + (-kalmanGain[0][0] * H[0][1] - kalmanGain[0][1] * H[1][1]) * covariance[1][1],
        ],
        [
          (-kalmanGain[1][0] * H[0][0] - kalmanGain[1][1] * H[1][0]) * covariance[0][0]
          + (1 - kalmanGain[1][0] * H[0][1] - kalmanGain[1][1] * H[1][1]) * covariance[1][0],
          (-kalmanGain[1][0] * H[0][0] - kalmanGain[1][1] * H[1][0]) * covariance[0][1]
          + (1 - kalmanGain[1][0] * H[0][1] - kalmanGain[1][1] * H[1][1]) * covariance[1][1],
        ],
      ]
    })

    return {
      algorithm: 'kalmanFilter',
      position: state,
      error: 0,
      executionTime: performance.now() - startTime,
      confidence: Math.max(0, 100 - Math.sqrt(covariance[0][0] + covariance[1][1])),
    }
  }

  /**
   * 粒子滤波算法实现
   *
   * @param {Beacon[]} beacons 信标数组
   * @param {Record<string, number>} rssiData RSSI数据映射
   * @param {number} particleCount 粒子数量
   * @return {AlgorithmResult} 算法执行结果
   */
  function particleFilter(beacons: Beacon[], rssiData: Record<string, number>, particleCount: number = 100): AlgorithmResult {
    const startTime = performance.now()

    // 初始化粒子群
    const particles: Array<{ x: number, y: number, weight: number }> = []

    // 确定搜索区域
    const minX = Math.min(...beacons.map(b => b.x)) - 50
    const maxX = Math.max(...beacons.map(b => b.x)) + 50
    const minY = Math.min(...beacons.map(b => b.y)) - 50
    const maxY = Math.max(...beacons.map(b => b.y)) + 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * (maxY - minY) + minY,
        weight: 1 / particleCount,
      })
    }

    // 权重更新
    let totalWeight = 0
    particles.forEach((particle) => {
      let likelihood = 1

      beacons.forEach((beacon) => {
        if (rssiData[beacon.id] !== undefined) {
          const expectedRssi = calculateRssi(particle, beacon, beacon.txPower, beacon.n)
          const actualRssi = rssiData[beacon.id]
          likelihood *= Math.exp(-((expectedRssi - actualRssi) ** 2) / 50)
        }
      })

      particle.weight = likelihood
      totalWeight += likelihood
    })

    // 归一化权重
    particles.forEach((particle) => {
      particle.weight /= totalWeight
    })

    // 重采样
    const newParticles: Array<{ x: number, y: number, weight: number }> = []
    const weights = particles.map(p => p.weight)

    for (let i = 0; i < particleCount; i++) {
      const random = Math.random()
      let cumulativeWeight = 0
      let selectedIndex = 0

      for (let j = 0; j < particles.length; j++) {
        cumulativeWeight += weights[j]
        if (cumulativeWeight >= random) {
          selectedIndex = j
          break
        }
      }

      const selectedParticle = particles[selectedIndex]
      newParticles.push({
        x: selectedParticle.x + (Math.random() - 0.5) * 2, // 添加小量噪声
        y: selectedParticle.y + (Math.random() - 0.5) * 2,
        weight: 1 / particleCount,
      })
    }

    // 计算估计位置
    const estimatedX = newParticles.reduce((sum, p) => sum + p.x, 0) / newParticles.length
    const estimatedY = newParticles.reduce((sum, p) => sum + p.y, 0) / newParticles.length

    // 计算置信度（基于粒子分布）
    const variance = newParticles.reduce((sum, p) => {
      return sum + (p.x - estimatedX) ** 2 + (p.y - estimatedY) ** 2
    }, 0) / newParticles.length

    return {
      algorithm: 'particleFilter',
      position: { x: estimatedX, y: estimatedY },
      error: 0,
      executionTime: performance.now() - startTime,
      confidence: Math.max(0, 100 - Math.sqrt(variance)),
    }
  }

  /**
   * 根据RSSI计算距离
   *
   * @param {number} rssi 接收信号强度指示
   * @param {number} txPower 发射功率
   * @param {number} n 路径损耗指数
   * @return {number} 计算得到的距离
   */
  function calculateDistance(rssi: number, txPower: number, n: number): number {
    return 10 ** ((txPower - rssi) / (10 * n))
  }

  /**
   * 根据位置和信标计算RSSI
   *
   * @param {Position} position 位置坐标
   * @param {Beacon} beacon 信标对象
   * @param {number} txPower 发射功率
   * @param {number} n 路径损耗指数
   * @return {number} 计算得到的RSSI值
   */
  function calculateRssi(position: Position, beacon: Beacon, txPower: number, n: number): number {
    const distance = Math.sqrt((position.x - beacon.x) ** 2 + (position.y - beacon.y) ** 2)
    return txPower - 10 * n * Math.log10(distance)
  }

  /**
   * 计算定位置信度
   *
   * @param {Array<{beacon: Beacon, distance: number}>} distances 信标距离数组
   * @return {number} 置信度值（0-100）
   */
  function calculateConfidence(distances: Array<{ beacon: Beacon, distance: number }>): number {
    if (distances.length === 0)
      return 0

    const avgDistance = distances.reduce((sum, d) => sum + d.distance, 0) / distances.length
    const variance = distances.reduce((sum, d) => sum + (d.distance - avgDistance) ** 2, 0) / distances.length

    return Math.max(0, 100 - Math.sqrt(variance))
  }

  /**
   * 最小二乘法三角定位
   *
   * @param {Array<{beacon: Beacon, distance: number}>} distances 信标距离数组
   * @return {Position} 计算得到的位置坐标
   */
  function leastSquaresTrilateration(distances: Array<{ beacon: Beacon, distance: number }>): Position {
    if (distances.length < 2) {
      return { x: 0, y: 0 }
    }

    // 使用前两个点作为基准
    const [p1, p2] = distances
    const [beacon1, beacon2] = [p1.beacon, p2.beacon]
    const [r1, r2] = [p1.distance, p2.distance]

    const dx = beacon2.x - beacon1.x
    const dy = beacon2.y - beacon1.y
    const d = Math.sqrt(dx * dx + dy * dy)

    if (d === 0) {
      return { x: beacon1.x, y: beacon1.y }
    }

    // 计算两个圆的交点
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))

    const x2 = beacon1.x + (a * dx) / d
    const y2 = beacon1.y + (a * dy) / d

    // 如果有第三个点，选择更靠近第三个点的解
    if (distances.length >= 3) {
      const p3 = distances[2]
      const [beacon3, r3] = [p3.beacon, p3.distance]

      const intersection1 = {
        x: x2 + (h * dy) / d,
        y: y2 - (h * dx) / d,
      }

      const intersection2 = {
        x: x2 - (h * dy) / d,
        y: y2 + (h * dx) / d,
      }

      const dist1 = Math.sqrt(
        (intersection1.x - beacon3.x) ** 2
        + (intersection1.y - beacon3.y) ** 2,
      )
      const dist2 = Math.sqrt(
        (intersection2.x - beacon3.x) ** 2
        + (intersection2.y - beacon3.y) ** 2,
      )

      return Math.abs(dist1 - r3) < Math.abs(dist2 - r3) ? intersection1 : intersection2
    }

    return {
      x: x2 + (h * dy) / d,
      y: y2 - (h * dx) / d,
    }
  }

  /**
   * 开始算法对比计算
   *
   * @return {Promise<void>}
   */
  async function startComparison() {
    isCalculating.value = true

    try {
      const results: Record<string, AlgorithmResult[]> = {
        trilateration: [],
        fingerprinting: [],
        centroid: [],
        weightedCentroid: [],
        kalmanFilter: [],
        particleFilter: [],
      }

      // 为每个测试点计算所有算法的结果
      testPoints.value.forEach((testPoint: any, index: number) => {
        const truePosition = truePositions.value[index]

        // 三角定位
        results.trilateration.push(trilateration(beacons.value, testPoint.rssi))

        // 指纹定位 (需要构建指纹数据库)
        const fingerprintDB = beacons.value.map(beacon => ({
          x: beacon.x,
          y: beacon.y,
          rssi: { [beacon.id]: beacon.txPower },
        }))
        results.fingerprinting.push(fingerprinting(testPoint, fingerprintDB))

        // 质心算法
        results.centroid.push(centroid(beacons.value, testPoint.rssi))

        // 加权质心算法
        results.weightedCentroid.push(weightedCentroid(beacons.value, testPoint.rssi))

        // 卡尔曼滤波 (使用其他算法结果作为测量)
        const measurements = [
          results.trilateration[results.trilateration.length - 1].position,
          results.centroid[results.centroid.length - 1].position,
        ].filter(p => p.x !== 0 || p.y !== 0)
        results.kalmanFilter.push(kalmanFilter(measurements))

        // 粒子滤波
        results.particleFilter.push(particleFilter(beacons.value, testPoint.rssi))

        // 计算误差
        Object.keys(results).forEach((algorithm) => {
          const result = results[algorithm][results[algorithm].length - 1]
          result.error = Math.sqrt(
            (result.position.x - truePosition.x) ** 2
            + (result.position.y - truePosition.y) ** 2,
          )
        })
      })

      // 计算统计指标
      comparisonResults.value = calculateComparisonResults(results)

      // 更新算法结果
      Object.keys(results).forEach((algorithm) => {
        algorithmResults.value[algorithm] = results[algorithm]
      })
    }
    catch (error) {
      console.error('算法对比计算失败:', error)
    }
    finally {
      isCalculating.value = false
    }
  }

  /**
   * 计算算法对比结果统计
   *
   * @param {Record<string, AlgorithmResult[]>} results 各算法的结果数组
   * @return {ComparisonResults} 对比结果统计数据
   */
  function calculateComparisonResults(results: Record<string, AlgorithmResult[]>): ComparisonResults {
    const algorithms: Record<string, any> = {}
    let totalTests = 0
    let totalError = 0
    const allErrors: number[] = []

    Object.entries(results).forEach(([algorithm, algorithmResults]) => {
      const errors = algorithmResults.map(r => r.error).filter(e => e < Infinity)
      const times = algorithmResults.map(r => r.executionTime)

      if (errors.length > 0) {
        const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length
        const maxError = Math.max(...errors)
        const minError = Math.min(...errors)
        const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length
        const successRate = (errors.length / algorithmResults.length) * 100

        // 计算标准差
        const variance = errors.reduce((sum, e) => sum + (e - avgError) ** 2, 0) / errors.length
        const stdDev = Math.sqrt(variance)

        algorithms[algorithm] = {
          averageError: avgError,
          maxError,
          minError,
          standardDeviation: stdDev,
          averageTime: avgTime,
          successRate,
        }

        totalTests += errors.length
        totalError += avgError
        allErrors.push(...errors)
      }
    })

    // 找出最佳算法
    const bestAccuracy = Object.entries(algorithms).reduce((best, [algorithm, metrics]) => {
      if (!best || metrics.averageError < best.error) {
        return { algorithm, error: metrics.averageError }
      }
      return best
    }, { algorithm: '', error: Infinity })

    const bestPerformance = Object.entries(algorithms).reduce((best, [algorithm, metrics]) => {
      if (!best || metrics.averageTime < best.time) {
        return { algorithm, time: metrics.averageTime }
      }
      return best
    }, { algorithm: '', time: Infinity })

    // 计算总体标准差
    const overallAvg = totalError / Object.keys(algorithms).length
    const overallVariance = allErrors.reduce((sum, e) => sum + (e - overallAvg) ** 2, 0) / allErrors.length
    const overallStdDev = Math.sqrt(overallVariance)

    return {
      totalTests,
      algorithms,
      bestAccuracy,
      bestPerformance,
      averageAccuracy: overallAvg,
      standardDeviation: overallStdDev,
    }
  }

  /**
   * 生成算法对比报告（Markdown格式）
   *
   * @return {string} Markdown格式的对比报告
   */
  function generateComparisonReport(): string {
    if (!comparisonResults.value)
      return ''

    const report = `
# 多算法定位引擎对比报告

生成时间: ${new Date().toLocaleString()}

## 测试概况

- 测试点数量: ${comparisonResults.value.totalTests}
- 参与算法数量: ${Object.keys(comparisonResults.value.algorithms).length}
- 平均定位精度: ${comparisonResults.value.averageAccuracy.toFixed(2)}m
- 精度标准差: ${comparisonResults.value.standardDeviation.toFixed(2)}m

## 算法性能排名

### 1. ${algorithmInfo.value[comparisonResults.value.bestAccuracy.algorithm].name} (最佳精度)
- 平均误差: ${comparisonResults.value.algorithms[comparisonResults.value.bestAccuracy.algorithm].averageError.toFixed(2)}m
- 成功率: ${comparisonResults.value.algorithms[comparisonResults.value.bestAccuracy.algorithm].successRate.toFixed(1)}%
- 平均计算时间: ${comparisonResults.value.algorithms[comparisonResults.value.bestAccuracy.algorithm].averageTime.toFixed(2)}ms

### 2. ${algorithmInfo.value[comparisonResults.value.bestPerformance.algorithm].name} (最佳性能)
- 平均计算时间: ${comparisonResults.value.bestPerformance.time.toFixed(2)}ms
- 平均误差: ${comparisonResults.value.algorithms[comparisonResults.value.bestPerformance.algorithm].averageError.toFixed(2)}m

## 详细算法对比

${Object.entries(comparisonResults.value.algorithms).map(([algorithm, metrics]) => `
### ${algorithmInfo.value[algorithm].name}

**算法描述:** ${algorithmInfo.value[algorithm].description}

**性能指标:**
- 平均误差: ${metrics.averageError.toFixed(2)}m
- 最大误差: ${metrics.maxError.toFixed(2)}m
- 最小误差: ${metrics.minError.toFixed(2)}m
- 标准差: ${metrics.standardDeviation.toFixed(2)}m
- 成功率: ${metrics.successRate.toFixed(1)}%
- 平均计算时间: ${metrics.averageTime.toFixed(2)}ms

**优点:** ${algorithmInfo.value[algorithm].advantages.join(', ')}

**缺点:** ${algorithmInfo.value[algorithm].disadvantages.join(', ')}

---
`).join('')}

## 结论与建议

根据测试结果，${algorithmInfo.value[comparisonResults.value.bestAccuracy.algorithm].name}在精度方面表现最佳，
而${algorithmInfo.value[comparisonResults.value.bestPerformance.algorithm].name}在计算效率方面最优。

选择建议:
- 追求精度优先的场景: 使用${algorithmInfo.value[comparisonResults.value.bestAccuracy.algorithm].name}
- 追求实时性优先的场景: 使用${algorithmInfo.value[comparisonResults.value.bestPerformance.algorithm].name}
- 需要平衡精度和性能: 可考虑${algorithmInfo.value.weightedCentroid.name}

---

*报告由多算法定位引擎对比系统自动生成*
    `.trim()

    return report
  }

  /**
   * 导出对比结果为JSON文件
   *
   * @return {void}
   */
  function exportResults() {
    if (!comparisonResults.value)
      return

    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalTests: comparisonResults.value.totalTests,
        beaconsCount: beacons.value.length,
        testPointsCount: testPoints.value.length,
      },
      results: comparisonResults.value,
      algorithmInfo: algorithmInfo.value,
      algorithmResults: algorithmResults.value,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `positioning-algorithm-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    isCalculating,
    comparisonResults,
    algorithmInfo,
    accuracyMetrics,
    startComparison,
    generateComparisonReport,
    exportResults,
  }
}
