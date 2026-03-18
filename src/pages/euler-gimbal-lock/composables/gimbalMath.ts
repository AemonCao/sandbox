import type { AxisAlignmentState, EulerAnglesState, GimbalStatus, Vec3Tuple } from './types'
import * as THREE from 'three'

export const GIMBAL_EULER_ORDER = 'YXZ'
export const GIMBAL_LOCK_TARGET_PITCH = 90
export const GIMBAL_LOCK_THRESHOLD_DEG = 1.5
export const GIMBAL_WARNING_THRESHOLD_DEG = 10

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeSignedDegrees(value: number) {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180
  return normalized === -180 ? 180 : normalized
}

function toTuple(vector: THREE.Vector3): Vec3Tuple {
  return [vector.x, vector.y, vector.z]
}

export function degreesToRadians(value: number) {
  return THREE.MathUtils.degToRad(value)
}

export function radiansToDegrees(value: number) {
  return THREE.MathUtils.radToDeg(value)
}

export function getPitchDistanceToLock(pitchDeg: number) {
  return Math.abs(Math.abs(normalizeSignedDegrees(pitchDeg)) - GIMBAL_LOCK_TARGET_PITCH)
}

export function computeAxisAlignment(angles: EulerAnglesState): AxisAlignmentState {
  const outerYawAxis = new THREE.Vector3(0, 1, 0)
  const rollAxisSource = new THREE.Vector3(0, 0, 1)
  const rotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      degreesToRadians(angles.pitch),
      degreesToRadians(angles.yaw),
      0,
      GIMBAL_EULER_ORDER,
    ),
  )

  const innerRollAxis = rollAxisSource.applyQuaternion(rotation).normalize()
  const dot = clamp(Math.abs(outerYawAxis.dot(innerRollAxis)), 0, 1)
  const angleDeg = radiansToDegrees(Math.acos(dot))

  return {
    outerYawAxis: toTuple(outerYawAxis),
    innerRollAxis: toTuple(innerRollAxis),
    angleDeg,
    alignment: dot,
  }
}

export function computeGimbalStatus(angles: EulerAnglesState): GimbalStatus {
  const axisAlignment = computeAxisAlignment(angles)
  const pitchDistanceDeg = getPitchDistanceToLock(angles.pitch)
  const isLocked = pitchDistanceDeg <= GIMBAL_LOCK_THRESHOLD_DEG || axisAlignment.angleDeg <= GIMBAL_LOCK_THRESHOLD_DEG
  const isWarning = !isLocked && (pitchDistanceDeg <= GIMBAL_WARNING_THRESHOLD_DEG || axisAlignment.angleDeg <= GIMBAL_WARNING_THRESHOLD_DEG)

  if (isLocked) {
    return {
      severity: 'locked',
      title: '已进入万向死锁',
      summary: 'yaw 轴与 roll 轴几乎重合，两次旋转正在争用同一个自由度。',
      detail: `当前 pitch 距离 ±90° 仅 ${pitchDistanceDeg.toFixed(1)}°，轴夹角 ${axisAlignment.angleDeg.toFixed(1)}°。`,
      axisAngleDeg: axisAlignment.angleDeg,
      alignment: axisAlignment.alignment,
      pitchDistanceDeg,
      isWarning: true,
      isLocked: true,
    }
  }

  if (isWarning) {
    return {
      severity: 'warning',
      title: '接近万向死锁',
      summary: 'pitch 正在逼近 ±90°，yaw 与 roll 轴快速趋同，控制冗余开始变得明显。',
      detail: `当前 pitch 距离锁死点 ${pitchDistanceDeg.toFixed(1)}°，轴夹角 ${axisAlignment.angleDeg.toFixed(1)}°。`,
      axisAngleDeg: axisAlignment.angleDeg,
      alignment: axisAlignment.alignment,
      pitchDistanceDeg,
      isWarning: true,
      isLocked: false,
    }
  }

  return {
    severity: 'stable',
    title: '自由度完整',
    summary: '三个旋转轴保持明显分离，yaw / pitch / roll 仍然各自独立。',
    detail: `当前 pitch 距离锁死点 ${pitchDistanceDeg.toFixed(1)}°，轴夹角 ${axisAlignment.angleDeg.toFixed(1)}°。`,
    axisAngleDeg: axisAlignment.angleDeg,
    alignment: axisAlignment.alignment,
    pitchDistanceDeg,
    isWarning: false,
    isLocked: false,
  }
}
