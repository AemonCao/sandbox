export function downsample(data: number[], targetSize: number): number[] {
  if (data.length <= targetSize)
    return data

  const step = data.length / targetSize
  const result: number[] = []

  for (let i = 0; i < targetSize; i++) {
    const start = Math.floor(i * step)
    const end = Math.floor((i + 1) * step)
    const slice = data.slice(start, end)
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length)
  }

  return result
}
