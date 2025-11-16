import hospitalPreset from './hospital.json'
import officePreset from './office.json'
import warehousePreset from './warehouse.json'

export interface PresetScene {
  name: string
  description?: string
  beacons: Array<{
    id: number
    type: 'beacon'
    x: number
    y: number
    z: number
    txPower: number
  }>
  clients: Array<{
    id: number
    type: 'client'
    x: number
    y: number
    z: number
  }>
  settings: {
    scale: number
    beaconHeight: number
    clientHeight: number
    beaconN: number
    clientRssiThreshold: number
    showCoverageArea: boolean
    coverageStep: number
  }
}

export const presetScenes: Record<string, PresetScene> = {
  hospital: hospitalPreset as PresetScene,
  office: officePreset as PresetScene,
  warehouse: warehousePreset as PresetScene,
}

export default presetScenes
