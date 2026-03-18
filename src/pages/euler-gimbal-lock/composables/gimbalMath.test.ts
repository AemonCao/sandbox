import { describe, expect, it } from 'vitest'
import { computeAxisAlignment, computeGimbalStatus, getPitchDistanceToLock } from './gimbalMath'

describe('gimbalMath', () => {
  it('treats neutral pitch as stable with separated axes', () => {
    const alignment = computeAxisAlignment({ yaw: 0, pitch: 0, roll: 0 })
    const status = computeGimbalStatus({ yaw: 0, pitch: 0, roll: 0 })

    expect(alignment.alignment).toBeCloseTo(0, 5)
    expect(alignment.angleDeg).toBeCloseTo(90, 5)
    expect(status.severity).toBe('stable')
  })

  it('detects lock when pitch reaches ninety degrees', () => {
    const alignment = computeAxisAlignment({ yaw: 30, pitch: 90, roll: 15 })
    const status = computeGimbalStatus({ yaw: 30, pitch: 90, roll: 15 })

    expect(alignment.alignment).toBeCloseTo(1, 5)
    expect(alignment.angleDeg).toBeCloseTo(0, 5)
    expect(status.severity).toBe('locked')
    expect(status.summary).toContain('同一个自由度')
  })

  it('enters warning state before the exact lock pitch', () => {
    const status = computeGimbalStatus({ yaw: 0, pitch: 82, roll: 0 })

    expect(getPitchDistanceToLock(82)).toBeCloseTo(8, 5)
    expect(status.severity).toBe('warning')
    expect(status.detail).toContain('轴夹角')
  })

  it('keeps pitch distance symmetric around the lock point', () => {
    expect(getPitchDistanceToLock(100)).toBeCloseTo(10, 5)
    expect(getPitchDistanceToLock(-100)).toBeCloseTo(10, 5)
  })
})
