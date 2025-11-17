import { ref } from 'vue'

// 数据类型定义
export interface Beacon {
  id: string
  x: number
  y: number
  txPower: number
  n: number
  color?: string
}

export interface TestPoint {
  id: string
  x: number
  y: number
  rssi: Record<string, number>
  truePosition?: { x: number, y: number }
}

export interface AlgorithmResult {
  algorithm: string
  position: { x: number, y: number }
  error: number
  executionTime: number
  confidence: number
  metadata?: any
}

export function useAlgorithmData() {
  // 响应式数据
  const beacons = ref<Beacon[]>([])
  const testPoints = ref<TestPoint[]>([])
  const truePositions = ref<{ x: number, y: number }[]>([])
  const algorithmResults = ref<Record<string, AlgorithmResult[]>>({
    trilateration: [],
    fingerprinting: [],
    centroid: [],
    weightedCentroid: [],
    kalmanFilter: [],
    particleFilter: [],
  })

  const selectedAlgorithm = ref('trilateration')
  const visualizationMode = ref('overlay') // overlay, comparison, accuracy, heatmap
  const showBeaconCoverage = ref(true)
  const showTestPaths = ref(false)
  const animationSpeed = ref(1.0)

  // 预设场景数据
  const presetScenes = {
    default: {
      name: '默认场景',
      description: '标准室内布局，4个信标，10个测试点',
      beacons: [
        { id: 'beacon1', x: 0, y: 0, txPower: -59, n: 2.0, color: '#ef4444' },
        { id: 'beacon2', x: 100, y: 0, txPower: -59, n: 2.0, color: '#3b82f6' },
        { id: 'beacon3', x: 100, y: 100, txPower: -59, n: 2.0, color: '#10b981' },
        { id: 'beacon4', x: 0, y: 100, txPower: -59, n: 2.0, color: '#f59e0b' },
      ],
      testPoints: [
        { id: 'point1', x: 20, y: 20 },
        { id: 'point2', x: 50, y: 20 },
        { id: 'point3', x: 80, y: 20 },
        { id: 'point4', x: 20, y: 50 },
        { id: 'point5', x: 50, y: 50 },
        { id: 'point6', x: 80, y: 50 },
        { id: 'point7', x: 20, y: 80 },
        { id: 'point8', x: 50, y: 80 },
        { id: 'point9', x: 80, y: 80 },
        { id: 'point10', x: 35, y: 35 },
      ],
    },
    dense: {
      name: '密集场景',
      description: '高密度信标部署，适合算法精度测试',
      beacons: [
        { id: 'beacon1', x: 0, y: 0, txPower: -59, n: 2.0, color: '#ef4444' },
        { id: 'beacon2', x: 50, y: 0, txPower: -59, n: 2.0, color: '#3b82f6' },
        { id: 'beacon3', x: 100, y: 0, txPower: -59, n: 2.0, color: '#10b981' },
        { id: 'beacon4', x: 0, y: 50, txPower: -59, n: 2.0, color: '#f59e0b' },
        { id: 'beacon5', x: 50, y: 50, txPower: -59, n: 2.0, color: '#8b5cf6' },
        { id: 'beacon6', x: 100, y: 50, txPower: -59, n: 2.0, color: '#ec4899' },
        { id: 'beacon7', x: 0, y: 100, txPower: -59, n: 2.0, color: '#06b6d4' },
        { id: 'beacon8', x: 50, y: 100, txPower: -59, n: 2.0, color: '#84cc16' },
        { id: 'beacon9', x: 100, y: 100, txPower: -59, n: 2.0, color: '#f97316' },
      ],
      testPoints: [
        { id: 'point1', x: 25, y: 25 },
        { id: 'point2', x: 50, y: 25 },
        { id: 'point3', x: 75, y: 25 },
        { id: 'point4', x: 25, y: 50 },
        { id: 'point5', x: 50, y: 50 },
        { id: 'point6', x: 75, y: 50 },
        { id: 'point7', x: 25, y: 75 },
        { id: 'point8', x: 50, y: 75 },
        { id: 'point9', x: 75, y: 75 },
      ],
    },
    sparse: {
      name: '稀疏场景',
      description: '低密度信标部署，测试边缘情况',
      beacons: [
        { id: 'beacon1', x: 0, y: 0, txPower: -59, n: 2.0, color: '#ef4444' },
        { id: 'beacon2', x: 150, y: 0, txPower: -59, n: 2.0, color: '#3b82f6' },
        { id: 'beacon3', x: 150, y: 150, txPower: -59, n: 2.0, color: '#10b981' },
      ],
      testPoints: [
        { id: 'point1', x: 20, y: 20 },
        { id: 'point2', x: 75, y: 20 },
        { id: 'point3', x: 130, y: 20 },
        { id: 'point4', x: 20, y: 75 },
        { id: 'point5', x: 75, y: 75 },
        { id: 'point6', x: 130, y: 75 },
        { id: 'point7', x: 20, y: 130 },
        { id: 'point8', x: 75, y: 130 },
        { id: 'point9', x: 130, y: 130 },
      ],
    },
    corridor: {
      name: '走廊场景',
      description: '模拟走廊环境的长条形布局',
      beacons: [
        { id: 'beacon1', x: 0, y: 25, txPower: -59, n: 2.0, color: '#ef4444' },
        { id: 'beacon2', x: 50, y: 25, txPower: -59, n: 2.0, color: '#3b82f6' },
        { id: 'beacon3', x: 100, y: 25, txPower: -59, n: 2.0, color: '#10b981' },
        { id: 'beacon4', x: 150, y: 25, txPower: -59, n: 2.0, color: '#f59e0b' },
        { id: 'beacon5', x: 200, y: 25, txPower: -59, n: 2.0, color: '#8b5cf6' },
      ],
      testPoints: [
        { id: 'point1', x: 10, y: 25 },
        { id: 'point2', x: 30, y: 25 },
        { id: 'point3', x: 50, y: 25 },
        { id: 'point4', x: 70, y: 25 },
        { id: 'point5', x: 90, y: 25 },
        { id: 'point6', x: 110, y: 25 },
        { id: 'point7', x: 130, y: 25 },
        { id: 'point8', x: 150, y: 25 },
        { id: 'point9', x: 170, y: 25 },
        { id: 'point10', x: 190, y: 25 },
      ],
    },
  }

  // 生成RSSI数据
  function generateRSSIData(beacons: Beacon[], testPoint: { x: number, y: number }): Record<string, number> {
    const rssiData: Record<string, number> = {}

    beacons.forEach((beacon) => {
      const distance = Math.sqrt(
        (testPoint.x - beacon.x) ** 2 + (testPoint.y - beacon.y) ** 2,
      )

      // 使用对数距离路径损耗模型
      let rssi = beacon.txPower - 10 * beacon.n * Math.log10(Math.max(0.1, distance))

      // 添加随机噪声
      const noise = (Math.random() - 0.5) * 10 // ±5dBm的噪声
      rssi += noise

      // 限制RSSI范围
      rssi = Math.max(-100, Math.min(-30, rssi))

      rssiData[beacon.id] = Math.round(rssi)
    })

    return rssiData
  }

  // 加载预设数据
  function loadPresetData(sceneType: string) {
    const scene = presetScenes[sceneType as keyof typeof presetScenes]
    if (!scene)
      return

    beacons.value = [...scene.beacons]
    truePositions.value = scene.testPoints.map(point => ({ x: point.x, y: point.y }))

    // 为测试点生成RSSI数据
    testPoints.value = scene.testPoints.map(point => ({
      ...point,
      rssi: generateRSSIData(scene.beacons, point),
    }))

    // 清空算法结果
    Object.keys(algorithmResults.value).forEach((algorithm) => {
      algorithmResults.value[algorithm] = []
    })
  }

  // 添加信标
  function addBeacon(beacon: Partial<Beacon>) {
    const newBeacon: Beacon = {
      id: `beacon${Date.now()}`,
      x: 50,
      y: 50,
      txPower: -59,
      n: 2.0,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      ...beacon,
    }
    beacons.value.push(newBeacon)

    // 更新所有测试点的RSSI数据
    updateTestPointsRSSI()
  }

  // 添加测试点
  function addTestPoint(testPoint: Partial<TestPoint>) {
    const newPoint: TestPoint = {
      id: `point${Date.now()}`,
      x: 50,
      y: 50,
      rssi: {},
      ...testPoint,
    }

    // 生成RSSI数据
    if (!newPoint.rssi || Object.keys(newPoint.rssi).length === 0) {
      newPoint.rssi = generateRSSIData(beacons.value, newPoint)
    }

    testPoints.value.push(newPoint)
    truePositions.value.push({ x: newPoint.x, y: newPoint.y })
  }

  // 删除信标
  function removeBeacon(beaconId: string) {
    const index = beacons.value.findIndex(b => b.id === beaconId)
    if (index !== -1) {
      beacons.value.splice(index, 1)
      updateTestPointsRSSI()
    }
  }

  // 删除测试点
  function removeTestPoint(pointId: string) {
    const index = testPoints.value.findIndex(p => p.id === pointId)
    if (index !== -1) {
      testPoints.value.splice(index, 1)
      truePositions.value.splice(index, 1)
    }
  }

  // 更新测试点RSSI数据
  function updateTestPointsRSSI() {
    testPoints.value.forEach((testPoint) => {
      testPoint.rssi = generateRSSIData(beacons.value, testPoint)
    })
  }

  // 更新信标位置
  function updateBeaconPosition(beaconId: string, x: number, y: number) {
    const beacon = beacons.value.find(b => b.id === beaconId)
    if (beacon) {
      beacon.x = x
      beacon.y = y
      updateTestPointsRSSI()
    }
  }

  // 更新测试点位置
  function updateTestPointPosition(pointId: string, x: number, y: number) {
    const point = testPoints.value.find(p => p.id === pointId)
    const trueIndex = testPoints.value.findIndex(p => p.id === pointId)

    if (point) {
      point.x = x
      point.y = y
      point.rssi = generateRSSIData(beacons.value, point)

      if (trueIndex !== -1) {
        truePositions.value[trueIndex] = { x, y }
      }
    }
  }

  // 清空所有数据
  function clearData() {
    beacons.value = []
    testPoints.value = []
    truePositions.value = []

    Object.keys(algorithmResults.value).forEach((algorithm) => {
      algorithmResults.value[algorithm] = []
    })
  }

  // 导出数据
  function exportData() {
    const exportData = {
      beacons: beacons.value,
      testPoints: testPoints.value,
      truePositions: truePositions.value,
      algorithmResults: algorithmResults.value,
      metadata: {
        exportTime: new Date().toISOString(),
        version: '1.0.0',
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `positioning-algorithm-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入数据
  function importData(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)

          if (data.beacons)
            beacons.value = data.beacons
          if (data.testPoints)
            testPoints.value = data.testPoints
          if (data.truePositions)
            truePositions.value = data.truePositions
          if (data.algorithmResults)
            algorithmResults.value = data.algorithmResults

          resolve(true)
        }
        catch (error) {
          console.error('导入数据失败:', error)
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }

  // 获取信标覆盖范围
  function getBeaconCoverage(beacon: Beacon, scale: number = 50): number {
    // 基于-85dBm作为可检测阈值计算覆盖半径
    const detectionThreshold = -85
    const distance = 10 ** ((beacon.txPower - detectionThreshold) / (10 * beacon.n))
    return distance * scale
  }

  // 计算算法精度分布
  function getAccuracyDistribution(algorithm: string): { ranges: string[], counts: number[] } {
    const results = algorithmResults.value[algorithm]
    if (!results || results.length === 0) {
      return { ranges: ['0-1m', '1-3m', '3-5m', '5-10m', '>10m'], counts: [0, 0, 0, 0, 0] }
    }

    const ranges = ['0-1m', '1-3m', '3-5m', '5-10m', '>10m']
    const counts = [0, 0, 0, 0, 0]

    results.forEach((result) => {
      const error = result.error
      if (error <= 1)
        counts[0]++
      else if (error <= 3)
        counts[1]++
      else if (error <= 5)
        counts[2]++
      else if (error <= 10)
        counts[3]++
      else counts[4]++
    })

    return { ranges, counts }
  }

  // 获取实时位置估计
  function getRealTimePosition(x: number, y: number): Record<string, { x: number, y: number, confidence: number }> {
    const positions: Record<string, { x: number, y: number, confidence: number }> = {}

    // 这里可以调用各种算法来计算实时位置
    // 为了简化，暂时返回输入位置
    positions.trilateration = { x, y, confidence: 85 }
    positions.centroid = { x, y, confidence: 70 }
    positions.weightedCentroid = { x, y, confidence: 75 }

    return positions
  }

  return {
    // 数据
    beacons,
    testPoints,
    truePositions,
    algorithmResults,
    selectedAlgorithm,
    visualizationMode,
    showBeaconCoverage,
    showTestPaths,
    animationSpeed,
    presetScenes,

    // 方法
    addBeacon,
    addTestPoint,
    removeBeacon,
    removeTestPoint,
    updateBeaconPosition,
    updateTestPointPosition,
    clearData,
    loadPresetData,
    exportData,
    importData,
    generateRSSIData,
    updateTestPointsRSSI,
    getBeaconCoverage,
    getAccuracyDistribution,
    getRealTimePosition,
  }
}
