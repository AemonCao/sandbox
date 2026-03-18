export interface EulerAnglesState {
  yaw: number
  pitch: number
  roll: number
}

export type GimbalSeverity = 'stable' | 'warning' | 'locked'

export type Vec3Tuple = [number, number, number]

export interface AxisAlignmentState {
  outerYawAxis: Vec3Tuple
  innerRollAxis: Vec3Tuple
  angleDeg: number
  alignment: number
}

export interface GimbalStatus {
  severity: GimbalSeverity
  title: string
  summary: string
  detail: string
  axisAngleDeg: number
  alignment: number
  pitchDistanceDeg: number
  isWarning: boolean
  isLocked: boolean
}

export interface SceneTheme {
  background: string
  panelOverlay: string
  gridPrimary: string
  gridSecondary: string
  payload: string
  payloadAccent: string
  ringYaw: string
  ringPitch: string
  ringRoll: string
  lineYaw: string
  linePitch: string
  lineRoll: string
  warning: string
  locked: string
  neutral: string
}

export interface PresetOption {
  key: string
  label: string
  description: string
  angles: EulerAnglesState
}
