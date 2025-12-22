export function downsample(data: number[], targetSize: number): number[] {
  if (data.length <= targetSize)
    return data

  const result: number[] = []
  const step = (data.length - 1) / (targetSize - 1)

  for (let i = 0; i < targetSize; i++) {
    const index = Math.round(i * step)
    result.push(data[index])
  }

  return result
}
