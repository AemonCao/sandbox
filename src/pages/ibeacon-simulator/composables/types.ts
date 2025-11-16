export interface Beacon {
  id: number
  type: 'beacon'
  x: number
  y: number
  z: number
  txPower: number
}

export interface Client {
  id: number
  type: 'client'
  x: number
  y: number
  z: number
}

export type SelectedObject = Beacon | Client | null

export interface BoxSelection {
  startX: number
  startY: number
  endX: number
  endY: number
  isActive: boolean
}

export interface SceneSettings {
  scale: number
  beaconHeight: number
  clientHeight: number
  beaconN: number
  clientRssiThreshold: number
  showCoverageArea: boolean
  coverageStep: number
}

export interface SceneData {
  beacons: Beacon[]
  clients: Client[]
  settings: SceneSettings
  metadata: {
    version: string
    createdAt: string
    name: string
  }
}
