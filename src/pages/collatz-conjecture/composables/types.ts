export interface CollatzTerm {
  step: number
  value: number
}

export interface CollatzAnalysis {
  start: number
  sequence: CollatzTerm[]
  steps: number
  peakValue: number
  peakStep: number
  oddCount: number
  evenCount: number
  reachedOne: boolean
  truncated: boolean
}
