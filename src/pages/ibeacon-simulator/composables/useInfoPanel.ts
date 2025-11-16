import type { Beacon, Client } from './types'
import { computed } from 'vue'
import { useCalculations } from './useCalculations'

// 定义数据类型接口
interface MultiSelectionData {
  type: 'multi-selection'
  totalCount: number
  beacons: Array<{ id: number, x: string, y: string }>
  clients: Array<{ id: number, x: string, y: string }>
}

interface InstructionData {
  type: 'instructions'
}

interface BeaconData {
  type: 'beacon'
  id: number
  x: string
  y: string
  xM: string
  yM: string
  z: number
  txPower: number
}

interface ClientData {
  type: 'client'
  id: number
  x: string
  y: string
  xM: string
  yM: string
  z: number
  rssiData: Array<{ beaconId: number, rssi: number, isAudible: boolean }>
}

export type InfoPanelData = MultiSelectionData | InstructionData | BeaconData | ClientData

export function useInfoPanel(
  selectedObject: { value: Beacon | Client | null },
  selectedObjects: { value: (Beacon | Client)[] },
  beacons: { value: Beacon[] },
  clients: { value: Client[] },
  scale: { value: number },
  clientRssiThreshold: { value: number },
  beaconN: { value: number },
) {
  const { calculateReceivedRSSI } = useCalculations()

  // 计算属性 - 返回结构化数据而不是HTML字符串
  const infoPanelData = computed((): InfoPanelData => {
    if (selectedObjects.value.length > 1) {
      // 多选设备信息
      const selectedBeacons = selectedObjects.value.filter(obj => obj.type === 'beacon') as Beacon[]
      const selectedClients = selectedObjects.value.filter(obj => obj.type === 'client') as Client[]

      return {
        type: 'multi-selection',
        totalCount: selectedObjects.value.length,
        beacons: selectedBeacons.map(b => ({
          id: b.id,
          x: (b.x / scale.value).toFixed(2),
          y: (b.y / scale.value).toFixed(2),
        })),
        clients: selectedClients.map(c => ({
          id: c.id,
          x: (c.x / scale.value).toFixed(2),
          y: (c.y / scale.value).toFixed(2),
        })),
      }
    }

    if (!selectedObject.value) {
      return { type: 'instructions' }
    }

    if (selectedObject.value.type === 'beacon') {
      const b = selectedObject.value as Beacon
      return {
        type: 'beacon',
        id: b.id,
        x: b.x.toFixed(1),
        y: b.y.toFixed(1),
        xM: (b.x / scale.value).toFixed(2),
        yM: (b.y / scale.value).toFixed(2),
        z: b.z,
        txPower: b.txPower,
      }
    }
    else {
      const c = selectedObject.value as Client
      return {
        type: 'client',
        id: c.id,
        x: c.x.toFixed(1),
        y: c.y.toFixed(1),
        xM: (c.x / scale.value).toFixed(2),
        yM: (c.y / scale.value).toFixed(2),
        z: c.z,
        rssiData: beacons.value.map((b) => {
          const rssi = calculateReceivedRSSI(b, c, scale.value, beaconN.value)
          return {
            beaconId: b.id,
            rssi,
            isAudible: rssi >= clientRssiThreshold.value,
          }
        }),
      }
    }
  })

  return {
    infoPanelData,
  }
}
