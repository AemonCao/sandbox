export type SensorStatus = 'available' | 'unavailable' | 'permission-needed' | 'error'
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'unknown'

export interface SensorData {
  id: string
  name: string
  status: SensorStatus
  value: any
  unit?: string
  lastUpdate: number
  error?: string
  permission?: PermissionState
  supportsPermissionAPI: boolean
  history?: number[]
  chartFields?: string[]
  chartMin?: number
  chartMax?: number
}

export interface SensorCategory {
  name: string
  sensors: SensorData[]
}
