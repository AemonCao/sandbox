import type { Beacon, Client } from './types'

/**
 * 提供iBeacon定位相关的计算功能
 *
 * @return {object} 计算函数集合
 * @return {Function} return.calculateReceivedRSSI 计算接收到的RSSI值
 * @return {Function} return.calculate3DDistanceFromRSSI 根据RSSI计算3D距离
 * @return {Function} return.calculate2DDistance 计算2D平面距离
 */
export function useCalculations() {
  // 记忆化优化 - 缓存RSSI计算结果
  const cachedRSSICalculation = (() => {
    const cache = new Map<string, number>()

    return (beacon: Beacon, client: Client, scale: number, beaconN: number): number => {
      // 缓存键包含位置信息，确保移动时重新计算
      const key = `${beacon.id}-${client.id}-${beacon.txPower}-${beacon.z}-${client.z}-${scale}-${beaconN}-${beacon.x.toFixed(0)}-${beacon.y.toFixed(0)}-${client.x.toFixed(0)}-${client.y.toFixed(0)}`

      if (cache.has(key)) {
        return cache.get(key)!
      }

      const result = performRSSICalculation(beacon, client, scale, beaconN)
      cache.set(key, result)

      // 限制缓存大小，避免内存泄漏
      if (cache.size > 1000) {
        const firstKey = cache.keys().next().value
        if (firstKey) {
          cache.delete(firstKey)
        }
      }

      return result
    }
  })()

  /**
   * 计算客户端接收到的RSSI值（带缓存优化）
   *
   * @param {Beacon} beacon 信标对象
   * @param {Client} client 客户端对象
   * @param {number} scale 缩放比例
   * @param {number} beaconN 路径损耗指数
   * @return {number} 计算得到的RSSI值
   */
  function calculateReceivedRSSI(beacon: Beacon, client: Client, scale: number, beaconN: number): number {
    return cachedRSSICalculation(beacon, client, scale, beaconN)
  }

  /**
   * 执行RSSI计算（无缓存）
   *
   * @param {Beacon} beacon 信标对象
   * @param {Client} client 客户端对象
   * @param {number} scale 缩放比例
   * @param {number} beaconN 路径损耗指数
   * @return {number} 计算得到的RSSI值
   */
  function performRSSICalculation(beacon: Beacon, client: Client, scale: number, beaconN: number): number {
    try {
      // 参数验证
      if (!beacon || !client || scale <= 0 || beaconN <= 0) {
        return -100 // 返回最小RSSI值
      }

      const dx = (beacon.x - client.x) / scale
      const dy = (beacon.y - client.y) / scale
      const dz = beacon.z - client.z

      const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // 检查距离是否有效
      if (Number.isNaN(distance3D) || !Number.isFinite(distance3D)) {
        return -100
      }

      if (distance3D < 0.01)
        return beacon.txPower

      const rssi = beacon.txPower - 10 * beaconN * Math.log10(distance3D)

      // 检查计算结果是否有效
      if (Number.isNaN(rssi) || !Number.isFinite(rssi)) {
        return -100
      }

      return Number.parseFloat(rssi.toFixed(2))
    }
    catch (error) {
      console.error('RSSI计算错误:', error)
      return -100
    }
  }

  /**
   * 根据RSSI值计算3D空间距离
   *
   * @param {Beacon} beacon 信标对象
   * @param {number} rssi 接收信号强度指示
   * @param {number} beaconN 路径损耗指数
   * @return {number} 3D空间距离（米）
   */
  function calculate3DDistanceFromRSSI(beacon: Beacon, rssi: number, beaconN: number): number {
    try {
      // 参数验证
      if (!beacon || Number.isNaN(rssi) || !Number.isFinite(rssi) || beaconN <= 0) {
        return 0
      }

      const exponent = (beacon.txPower - rssi) / (10 * beaconN)

      // 检查指数是否有效
      if (Number.isNaN(exponent) || !Number.isFinite(exponent)) {
        return 0
      }

      const distance = 10 ** exponent

      // 检查距离是否合理
      if (Number.isNaN(distance) || !Number.isFinite(distance) || distance < 0 || distance > 1000) {
        return 0
      }

      return Number.parseFloat(distance.toFixed(3))
    }
    catch (error) {
      console.error('3D距离计算错误:', error)
      return 0
    }
  }

  /**
   * 根据3D距离和高度差计算2D平面距离
   *
   * @param {number} distance3D 3D空间距离
   * @param {number} heightDiff 高度差
   * @return {number} 2D平面距离（米）
   */
  function calculate2DDistance(distance3D: number, heightDiff: number): number {
    try {
      // 参数验证
      if (Number.isNaN(distance3D) || !Number.isFinite(distance3D)
        || Number.isNaN(heightDiff) || !Number.isFinite(heightDiff)
        || distance3D < 0) {
        return 0
      }

      const squaredDiff = heightDiff * heightDiff
      const squaredDistance = distance3D * distance3D

      if (squaredDistance < squaredDiff) {
        return 0
      }

      const distance2D = Math.sqrt(squaredDistance - squaredDiff)

      // 检查结果有效性
      if (Number.isNaN(distance2D) || !Number.isFinite(distance2D) || distance2D < 0) {
        return 0
      }

      return Number.parseFloat(distance2D.toFixed(3))
    }
    catch (error) {
      console.error('2D距离计算错误:', error)
      return 0
    }
  }

  return {
    calculateReceivedRSSI,
    calculate3DDistanceFromRSSI,
    calculate2DDistance,
  }
}
