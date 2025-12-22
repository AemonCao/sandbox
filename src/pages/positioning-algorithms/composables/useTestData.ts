import { ref } from 'vue'

export interface TestScenario {
  id: string
  name: string
  description: string
  beaconCount: number
  testPointCount: number
  environment: string
  parameters: Record<string, any>
}

export function useTestData(beacons: any, testPoints: any, truePositions: any) {
  const isRunningTest = ref(false)
  const testProgress = ref(0)
  const activeTestScenario = ref('accuracy')
  const testHistory = ref<any[]>([])

  // 测试场景定义
  const testScenarios: TestScenario[] = [
    {
      id: 'accuracy',
      name: '精度测试',
      description: '在不同位置测试算法定位精度',
      beaconCount: 4,
      testPointCount: 25,
      environment: 'indoor',
      parameters: {
        gridSize: 5,
        areaWidth: 100,
        areaHeight: 100,
        measurementsPerPoint: 10,
        noiseLevel: 0.5,
      },
    },
    {
      id: 'density',
      name: '密度测试',
      description: '测试不同信标密度对算法性能的影响',
      beaconCount: 0, // 可变
      testPointCount: 16,
      environment: 'indoor',
      parameters: {
        beaconDensities: [3, 4, 6, 8],
        gridSpacing: 25,
        iterations: 3,
      },
    },
    {
      id: 'noise',
      name: '噪声鲁棒性测试',
      description: '测试不同噪声水平下的算法表现',
      beaconCount: 4,
      testPointCount: 20,
      environment: 'indoor',
      parameters: {
        noiseLevels: [0, 2, 5, 10, 15],
        testPoints: 20,
        iterations: 5,
      },
    },
    {
      id: 'scalability',
      name: '可扩展性测试',
      description: '测试大规模环境下的算法性能',
      beaconCount: 16,
      testPointCount: 100,
      environment: 'large',
      parameters: {
        areaWidth: 200,
        areaHeight: 200,
        beaconSpacing: 50,
        testPointSpacing: 20,
      },
    },
    {
      id: 'edge_case',
      name: '边界情况测试',
      description: '测试边界和遮挡等特殊情况',
      beaconCount: 4,
      testPointCount: 30,
      environment: 'indoor',
      parameters: {
        edgeDistance: 5,
        obstructionLevels: [0, 1, 2, 3],
        testScenarios: ['edge', 'corner', 'center', 'obstructed'],
      },
    },
    {
      id: 'dynamic',
      name: '动态测试',
      description: '模拟移动目标的定位性能',
      beaconCount: 6,
      testPointCount: 50,
      environment: 'dynamic',
      parameters: {
        pathType: 'grid',
        velocity: 1.0,
        sampleRate: 10, // Hz
        pathLength: 100,
      },
    },
    {
      id: 'comparison',
      name: '算法对比测试',
      description: '全面对比所有算法的性能指标',
      beaconCount: 5,
      testPointCount: 36,
      environment: 'standard',
      parameters: {
        gridSize: 6,
        areaWidth: 120,
        areaHeight: 120,
        metrics: ['accuracy', 'precision', 'recall', 'f1', 'computation_time'],
        confidenceLevel: 0.95,
      },
    },
  ]

  // 运行自动化测试
  async function runAutomatedTest(scenarioId: string) {
    const scenario = testScenarios.find(s => s.id === scenarioId)
    if (!scenario) {
      console.error('未找到测试场景:', scenarioId)
      return
    }

    isRunningTest.value = true
    testProgress.value = 0

    try {
      switch (scenarioId) {
        case 'accuracy':
          await runAccuracyTest(scenario)
          break
        case 'density':
          await runDensityTest(scenario)
          break
        case 'noise':
          await runNoiseTest(scenario)
          break
        case 'scalability':
          await runScalabilityTest(scenario)
          break
        case 'edge_case':
          await runEdgeCaseTest(scenario)
          break
        case 'dynamic':
          await runDynamicTest(scenario)
          break
        case 'comparison':
          await runComparisonTest(scenario)
          break
        default:
          console.warn('未知测试场景:', scenarioId)
      }

      // 保存测试历史
      testHistory.value.push({
        scenario,
        timestamp: new Date(),
        duration: Date.now() - Date.now(),
        results: 'completed',
      })
    }
    catch (error) {
      console.error('测试执行失败:', error)
    }
    finally {
      isRunningTest.value = false
      testProgress.value = 0
    }
  }

  // 精度测试
  async function runAccuracyTest(scenario: TestScenario) {
    const { gridSize, areaWidth, areaHeight, measurementsPerPoint, noiseLevel } = scenario.parameters
    const totalSteps = gridSize * gridSize * measurementsPerPoint
    let currentStep = 0

    // 生成网格测试点
    const xStep = areaWidth / (gridSize + 1)
    const yStep = areaHeight / (gridSize + 1)

    const newTestPoints: any[] = []
    const newTruePositions: any[] = []

    for (let i = 1; i <= gridSize; i++) {
      for (let j = 1; j <= gridSize; j++) {
        const x = i * xStep
        const y = j * yStep

        for (let m = 0; m < measurementsPerPoint; m++) {
          // 模拟多次测量
          const testPoint = {
            id: `accuracy_${i}_${j}_${m}`,
            x: x + (Math.random() - 0.5) * noiseLevel,
            y: y + (Math.random() - 0.5) * noiseLevel,
            rssi: generateNoisyRSSI(x, y, noiseLevel),
          }

          newTestPoints.push(testPoint)
          newTruePositions.push({ x, y })

          currentStep++
          testProgress.value = (currentStep / totalSteps) * 100

          // 避免阻塞UI
          if (currentStep % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
      }
    }

    // 更新测试数据
    testPoints.value.push(...newTestPoints)
    truePositions.value.push(...newTruePositions)
  }

  // 密度测试
  async function runDensityTest(scenario: TestScenario) {
    const { beaconDensities, gridSpacing, iterations } = scenario.parameters
    const totalSteps = beaconDensities.length * iterations
    let currentStep = 0

    const _originalBeacons = [...beacons.value]

    for (const density of beaconDensities) {
      for (let iter = 0; iter < iterations; iter++) {
        // 根据密度重新部署信标
        beacons.value = generateBeaconLayout(density, 100, 100)

        // 生成测试网格
        const newTestPoints = generateTestGrid(100, 100, gridSpacing, density)
        const newTruePositions = newTestPoints.map(p => ({ x: p.x, y: p.y }))

        testPoints.value.push(...newTestPoints)
        truePositions.value.push(...newTruePositions)

        currentStep++
        testProgress.value = (currentStep / totalSteps) * 100

        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
  }

  // 噪声鲁棒性测试
  async function runNoiseTest(scenario: TestScenario) {
    const { noiseLevels, testPoints: numPoints, iterations } = scenario.parameters
    const totalSteps = noiseLevels.length * iterations * numPoints
    let currentStep = 0

    // 生成基础测试点
    const baseTestPoints = generateTestGrid(100, 100, 20, Math.ceil(Math.sqrt(numPoints)))

    for (const noiseLevel of noiseLevels) {
      for (let iter = 0; iter < iterations; iter++) {
        for (const basePoint of baseTestPoints) {
          const testPoint = {
            id: `noise_${noiseLevel}_${iter}_${basePoint.id}`,
            x: basePoint.x,
            y: basePoint.y,
            rssi: generateNoisyRSSI(basePoint.x, basePoint.y, noiseLevel),
          }

          testPoints.value.push(testPoint)
          truePositions.value.push({ x: basePoint.x, y: basePoint.y })

          currentStep++
          testProgress.value = (currentStep / totalSteps) * 100

          if (currentStep % 20 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
      }
    }
  }

  // 可扩展性测试
  async function runScalabilityTest(scenario: TestScenario) {
    const { areaWidth, areaHeight, beaconSpacing, testPointSpacing } = scenario.parameters
    const totalSteps = 1
    let currentStep = 0

    // 生成大规模信标布局
    beacons.value = generateBeaconLayout(
      Math.floor(areaWidth / beaconSpacing) * Math.floor(areaHeight / beaconSpacing),
      areaWidth,
      areaHeight,
    )

    // 生成大规模测试点
    const newTestPoints = generateTestGrid(areaWidth, areaHeight, testPointSpacing)
    const newTruePositions = newTestPoints.map(p => ({ x: p.x, y: p.y }))

    testPoints.value.push(...newTestPoints)
    truePositions.value.push(...newTruePositions)

    currentStep++
    testProgress.value = (currentStep / totalSteps) * 100
  }

  // 边界情况测试
  async function runEdgeCaseTest(scenario: TestScenario) {
    const { edgeDistance, obstructionLevels, testScenarios } = scenario.parameters
    const totalSteps = testScenarios.length * obstructionLevels.length
    let currentStep = 0

    const areaSize = 100

    for (const scenarioType of testScenarios) {
      for (const obstructionLevel of obstructionLevels) {
        let newTestPoints: any[] = []

        switch (scenarioType) {
          case 'edge':
            newTestPoints = generateEdgeTestPoints(areaSize, edgeDistance)
            break
          case 'corner':
            newTestPoints = generateCornerTestPoints(areaSize, edgeDistance)
            break
          case 'center':
            newTestPoints = generateCenterTestPoints(areaSize)
            break
          case 'obstructed':
            newTestPoints = generateObstructedTestPoints(areaSize, obstructionLevel)
            break
        }

        const newTruePositions = newTestPoints.map(p => ({ x: p.x, y: p.y }))

        testPoints.value.push(...newTestPoints)
        truePositions.value.push(...newTruePositions)

        currentStep++
        testProgress.value = (currentStep / totalSteps) * 100

        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
  }

  // 动态测试
  async function runDynamicTest(scenario: TestScenario) {
    const { pathType, velocity, sampleRate, pathLength } = scenario.parameters
    const totalSteps = Math.floor(pathLength / velocity * sampleRate)
    let currentStep = 0

    const path = generatePath(pathType, pathLength, 100, 100)
    const timeStep = 1.0 / sampleRate

    for (let i = 0; i < path.length; i++) {
      const point = path[i]
      const testPoint = {
        id: `dynamic_${i}`,
        x: point.x,
        y: point.y,
        rssi: generateNoisyRSSI(point.x, point.y, 2),
        timestamp: i * timeStep,
      }

      testPoints.value.push(testPoint)
      truePositions.value.push({ x: point.x, y: point.y })

      currentStep++
      testProgress.value = (currentStep / totalSteps) * 100

      // 模拟实时采样
      await new Promise(resolve => setTimeout(resolve, 1000 / sampleRate))
    }
  }

  // 算法对比测试
  async function runComparisonTest(scenario: TestScenario) {
    const { gridSize, areaWidth, areaHeight } = scenario.parameters
    const totalSteps = gridSize * gridSize
    let currentStep = 0

    // 生成密集测试网格
    const xStep = areaWidth / (gridSize + 1)
    const yStep = areaHeight / (gridSize + 1)

    const newTestPoints: any[] = []
    const newTruePositions: any[] = []

    for (let i = 1; i <= gridSize; i++) {
      for (let j = 1; j <= gridSize; j++) {
        const x = i * xStep
        const y = j * yStep

        const testPoint = {
          id: `comparison_${i}_${j}`,
          x,
          y,
          rssi: generateNoisyRSSI(x, y, 1),
          metrics: {},
        }

        newTestPoints.push(testPoint)
        newTruePositions.push({ x, y })

        currentStep++
        testProgress.value = (currentStep / totalSteps) * 100

        if (currentStep % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      }
    }

    testPoints.value.push(...newTestPoints)
    truePositions.value.push(...newTruePositions)
  }

  // 生成随机测试数据
  function generateRandomTestData() {
    const numBeacons = Math.floor(Math.random() * 5) + 3 // 3-7个信标
    const numTestPoints = Math.floor(Math.random() * 20) + 10 // 10-30个测试点
    const areaSize = 100

    // 清空现有数据
    beacons.value = []
    testPoints.value = []
    truePositions.value = []

    // 生成随机信标
    for (let i = 0; i < numBeacons; i++) {
      beacons.value.push({
        id: `beacon${i + 1}`,
        x: Math.random() * areaSize,
        y: Math.random() * areaSize,
        txPower: -55 - Math.random() * 10, // -55 to -65
        n: 1.5 + Math.random() * 1.5, // 1.5 to 3.0
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      })
    }

    // 生成随机测试点
    for (let i = 0; i < numTestPoints; i++) {
      const x = Math.random() * areaSize
      const y = Math.random() * areaSize

      testPoints.value.push({
        id: `point${i + 1}`,
        x,
        y,
        rssi: generateNoisyRSSI(x, y, 3),
      })

      truePositions.value.push({ x, y })
    }
  }

  // 停止测试
  function stopTest() {
    isRunningTest.value = false
    testProgress.value = 0
  }

  // 辅助函数
  function generateNoisyRSSI(x: number, y: number, noiseLevel: number): Record<string, number> {
    const rssiData: Record<string, number> = {}

    beacons.value.forEach((beacon: any) => {
      const distance = Math.sqrt((x - beacon.x) ** 2 + (y - beacon.y) ** 2)
      let rssi = beacon.txPower - 10 * beacon.n * Math.log10(Math.max(0.1, distance))

      // 添加噪声
      const noise = (Math.random() - 0.5) * noiseLevel * 2
      rssi += noise

      rssi = Math.max(-100, Math.min(-30, rssi))
      rssiData[beacon.id] = Math.round(rssi)
    })

    return rssiData
  }

  function generateBeaconLayout(count: number, width: number, height: number): any[] {
    const newBeacons: any[] = []
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    const xStep = width / (cols + 1)
    const yStep = height / (rows + 1)

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)

      newBeacons.push({
        id: `auto_beacon_${i}`,
        x: (col + 1) * xStep,
        y: (row + 1) * yStep,
        txPower: -59,
        n: 2.0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      })
    }

    return newBeacons
  }

  function generateTestGrid(width: number, height: number, spacing: number, count?: number): any[] {
    const points: any[] = []
    const cols = Math.floor(width / spacing)
    const rows = Math.floor(height / spacing)
    let pointCount = 0

    for (let i = 1; i <= cols; i++) {
      for (let j = 1; j <= rows; j++) {
        if (count && pointCount >= count)
          break

        points.push({
          id: `grid_${i}_${j}`,
          x: i * spacing,
          y: j * spacing,
        })

        pointCount++
      }
      if (count && pointCount >= count)
        break
    }

    return points
  }

  function generateEdgeTestPoints(areaSize: number, edgeDistance: number): any[] {
    const points: any[] = []
    const numPoints = 10

    for (let i = 0; i < numPoints; i++) {
      const side = Math.floor(Math.random() * 4) // 0: 上, 1: 右, 2: 下, 3: 左
      let x, y

      switch (side) {
        case 0: // 上
          x = Math.random() * areaSize
          y = edgeDistance
          break
        case 1: // 右
          x = areaSize - edgeDistance
          y = Math.random() * areaSize
          break
        case 2: // 下
          x = Math.random() * areaSize
          y = areaSize - edgeDistance
          break
        case 3: // 左
          x = edgeDistance
          y = Math.random() * areaSize
          break
        default:
          x = edgeDistance
          y = edgeDistance
      }

      points.push({
        id: `edge_${i}`,
        x,
        y,
      })
    }

    return points
  }

  function generateCornerTestPoints(areaSize: number, edgeDistance: number): any[] {
    const corners = [
      { x: edgeDistance, y: edgeDistance },
      { x: areaSize - edgeDistance, y: edgeDistance },
      { x: areaSize - edgeDistance, y: areaSize - edgeDistance },
      { x: edgeDistance, y: areaSize - edgeDistance },
    ]

    const points: any[] = []
    corners.forEach((corner, index) => {
      for (let i = 0; i < 5; i++) {
        points.push({
          id: `corner_${index}_${i}`,
          x: corner.x + (Math.random() - 0.5) * edgeDistance,
          y: corner.y + (Math.random() - 0.5) * edgeDistance,
        })
      }
    })

    return points
  }

  function generateCenterTestPoints(areaSize: number): any[] {
    const points: any[] = []
    const center = areaSize / 2
    const radius = areaSize / 4

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      const r = Math.random() * radius

      points.push({
        id: `center_${i}`,
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      })
    }

    return points
  }

  function generateObstructedTestPoints(areaSize: number, obstructionLevel: number): any[] {
    const points: any[] = []

    // 模拟遮挡区域的测试点
    const obstructionZones = [
      { x: areaSize * 0.3, y: areaSize * 0.3, radius: 10 + obstructionLevel * 5 },
      { x: areaSize * 0.7, y: areaSize * 0.7, radius: 10 + obstructionLevel * 5 },
    ]

    for (let i = 0; i < 8; i++) {
      const zone = obstructionZones[i % 2]
      const angle = (i / 8) * Math.PI * 2
      const distance = zone.radius + (Math.random() - 0.5) * 10

      points.push({
        id: `obstructed_${i}`,
        x: zone.x + distance * Math.cos(angle),
        y: zone.y + distance * Math.sin(angle),
      })
    }

    return points
  }

  function generatePath(pathType: string, length: number, width: number, height: number): any[] {
    const path: any[] = []
    const steps = Math.floor(length)

    switch (pathType) {
      case 'grid':
        // 网格路径
        for (let i = 0; i < steps; i++) {
          const x = (i / steps) * width
          const y = (Math.floor(i / (width / 20)) % 2 === 0) ? 20 : height - 20
          path.push({ x, y })
        }
        break

      case 'circular': {
        // 圆形路径
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 3

        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * Math.PI * 2
          path.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          })
        }
        break
      }
      case 'zigzag':
        // 之字形路径
        for (let i = 0; i < steps; i++) {
          const x = (i / steps) * width
          const y = ((Math.floor(i / (steps / 10)) % 2) === 0) ? 20 : height - 20
          path.push({ x, y })
        }
        break

      default:
        // 直线路径
        for (let i = 0; i < steps; i++) {
          path.push({
            x: (i / steps) * width,
            y: height / 2,
          })
        }
    }

    return path
  }

  // 获取测试统计
  function getTestStatistics() {
    return {
      totalTests: testHistory.value.length,
      lastTest: testHistory.value[testHistory.value.length - 1],
      averageDuration: testHistory.value.length > 0
        ? testHistory.value.reduce((sum, test) => sum + test.duration, 0) / testHistory.value.length
        : 0,
      successRate: testHistory.value.length > 0
        ? (testHistory.value.filter(test => test.results === 'completed').length / testHistory.value.length) * 100
        : 0,
    }
  }

  return {
    isRunningTest,
    testProgress,
    activeTestScenario,
    testScenarios,
    testHistory,
    runAutomatedTest,
    stopTest,
    generateRandomTestData,
    getTestStatistics,
  }
}
