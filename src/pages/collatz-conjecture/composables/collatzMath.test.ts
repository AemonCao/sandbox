import { describe, expect, it } from 'vitest'
import { analyzeCollatz, COLLATZ_MAX_START, COLLATZ_MIN_START, nextCollatzValue } from './collatzMath'

describe('collatzMath', () => {
  it('returns the trivial sequence for 1', () => {
    const analysis = analyzeCollatz(1)

    expect(analysis.sequence).toEqual([{ step: 0, value: 1 }])
    expect(analysis.steps).toBe(0)
    expect(analysis.reachedOne).toBe(true)
    expect(analysis.truncated).toBe(false)
    expect(analysis.oddCount).toBe(1)
    expect(analysis.evenCount).toBe(0)
  })

  it('builds the standard sequence for 6', () => {
    const analysis = analyzeCollatz(6)

    expect(analysis.sequence.map(term => term.value)).toEqual([6, 3, 10, 5, 16, 8, 4, 2, 1])
    expect(analysis.steps).toBe(8)
    expect(analysis.reachedOne).toBe(true)
    expect(analysis.truncated).toBe(false)
  })

  it('captures the classic 27 example stats', () => {
    const analysis = analyzeCollatz(27)

    expect(analysis.steps).toBe(111)
    expect(analysis.peakValue).toBe(9232)
    expect(analysis.peakStep).toBe(77)
    expect(analysis.reachedOne).toBe(true)
  })

  it('applies the odd and even rules and tracks parity counts', () => {
    expect(nextCollatzValue(8)).toBe(4)
    expect(nextCollatzValue(5)).toBe(16)

    const analysis = analyzeCollatz(6)
    expect(analysis.evenCount).toBe(6)
    expect(analysis.oddCount).toBe(3)
  })

  it('rejects invalid inputs and out-of-range starts', () => {
    expect(() => analyzeCollatz(0)).toThrow(/起点/)
    expect(() => analyzeCollatz(-3)).toThrow(/起点/)
    expect(() => analyzeCollatz(1.5)).toThrow(/起点/)
    expect(() => analyzeCollatz(COLLATZ_MIN_START - 1)).toThrow(/起点/)
    expect(() => analyzeCollatz(COLLATZ_MAX_START + 1)).toThrow(/起点/)
  })

  it('marks analysis as truncated when maxSteps is reached', () => {
    const analysis = analyzeCollatz(27, { maxSteps: 20 })

    expect(analysis.steps).toBe(20)
    expect(analysis.sequence).toHaveLength(21)
    expect(analysis.reachedOne).toBe(false)
    expect(analysis.truncated).toBe(true)
  })
})
