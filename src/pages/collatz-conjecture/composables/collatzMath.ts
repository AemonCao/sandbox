import type { CollatzAnalysis, CollatzTerm } from './types'

export const COLLATZ_MIN_START = 1
export const COLLATZ_MAX_START = 1_000_000
export const COLLATZ_DEFAULT_MAX_STEPS = 10_000

function assertPositiveSafeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new RangeError(`${label} 必须是正整数且处于安全整数范围内`)
}

function assertValidStart(start: number) {
  assertPositiveSafeInteger(start, '起点')

  if (start < COLLATZ_MIN_START || start > COLLATZ_MAX_START)
    throw new RangeError(`起点必须在 ${COLLATZ_MIN_START} 到 ${COLLATZ_MAX_START} 之间`)
}

function assertValidMaxSteps(maxSteps: number) {
  assertPositiveSafeInteger(maxSteps, 'maxSteps')
}

export function nextCollatzValue(value: number): number {
  assertPositiveSafeInteger(value, '当前值')

  if (value % 2 === 0)
    return value / 2

  if (value > Math.floor((Number.MAX_SAFE_INTEGER - 1) / 3))
    throw new RangeError('当前值过大，3n + 1 会超出安全整数范围')

  return value * 3 + 1
}

export function analyzeCollatz(start: number, options?: { maxSteps?: number }): CollatzAnalysis {
  assertValidStart(start)

  const maxSteps = options?.maxSteps ?? COLLATZ_DEFAULT_MAX_STEPS
  assertValidMaxSteps(maxSteps)

  const sequence: CollatzTerm[] = [{ step: 0, value: start }]
  let currentValue = start
  let steps = 0
  let peakValue = start
  let peakStep = 0
  let oddCount = start % 2 === 0 ? 0 : 1
  let evenCount = start % 2 === 0 ? 1 : 0

  while (currentValue !== 1 && steps < maxSteps) {
    currentValue = nextCollatzValue(currentValue)
    steps += 1

    const term: CollatzTerm = { step: steps, value: currentValue }
    sequence.push(term)

    if (currentValue > peakValue) {
      peakValue = currentValue
      peakStep = steps
    }

    if (currentValue % 2 === 0)
      evenCount += 1
    else
      oddCount += 1
  }

  return {
    start,
    sequence,
    steps,
    peakValue,
    peakStep,
    oddCount,
    evenCount,
    reachedOne: currentValue === 1,
    truncated: currentValue !== 1,
  }
}
