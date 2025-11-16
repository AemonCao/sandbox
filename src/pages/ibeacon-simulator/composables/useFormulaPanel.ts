import type { Beacon, Client } from './types'
import { computed } from 'vue'
import { useCalculations } from './useCalculations'

// 公式面板数据类型
interface EmptyFormulaData {
  type: 'empty'
}

interface InsufficientFormulaData {
  type: 'insufficient'
  count: number
  clientId: number
}

interface CalculationFormulaData {
  type: 'calculation'
  clientId: number
  audibleCount: number
  beaconData: Array<{
    beaconId: number
    txPower: number
    receivedRssi: number
    distance3D: string
    heightDiff: number
    distance2D: string
    x: string
    y: string
  }>
  n: number
}

export type FormulaPanelData = EmptyFormulaData | InsufficientFormulaData | CalculationFormulaData

export function useFormulaPanel(
  selectedObject: { value: Beacon | Client | null },
  beacons: { value: Beacon[] },
  clientRssiThreshold: { value: number },
  beaconN: { value: number },
) {
  const { calculateReceivedRSSI, calculate3DDistanceFromRSSI, calculate2DDistance } = useCalculations()

  // 计算属性 - 返回结构化数据
  const formulaPanelData = computed((): FormulaPanelData => {
    if (!selectedObject.value || selectedObject.value.type !== 'client') {
      return { type: 'empty' }
    }

    const client = selectedObject.value as Client
    const audibleBeacons = beacons.value.filter(b => calculateReceivedRSSI(b, client, 50, beaconN.value) >= clientRssiThreshold.value) // 使用默认scale值

    if (audibleBeacons.length < 3) {
      return {
        type: 'insufficient',
        count: audibleBeacons.length,
        clientId: client.id,
      }
    }

    const beaconData = audibleBeacons.slice(0, 3).map((b) => {
      const receivedRssi = calculateReceivedRSSI(b, client, 50, beaconN.value)
      const distance3D = calculate3DDistanceFromRSSI(b, receivedRssi, beaconN.value)
      const heightDiff = b.z - client.z
      const distance2D = calculate2DDistance(distance3D, heightDiff)

      return {
        beaconId: b.id,
        txPower: b.txPower,
        receivedRssi,
        distance3D: distance3D.toFixed(3),
        heightDiff,
        distance2D: distance2D.toFixed(3),
        x: (b.x / 50).toFixed(3), // 使用默认scale值
        y: (b.y / 50).toFixed(3),
      }
    })

    return {
      type: 'calculation',
      clientId: client.id,
      audibleCount: audibleBeacons.length,
      beaconData,
      n: beaconN.value,
    }
  })

  return {
    formulaPanelData,
  }
}
