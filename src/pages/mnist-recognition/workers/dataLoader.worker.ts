export interface LoadProgress {
  type: 'progress'
  stage: 'fetching' | 'parsing'
  progress: number
  loaded?: number
  total?: number
}

export interface LoadComplete {
  type: 'complete'
  images: Float32Array
  labels: Uint8Array
  numImages: number
}

export interface LoadError {
  type: 'error'
  message: string
}

// type WorkerMessage = LoadProgress | LoadComplete | LoadError

async function fetchWithProgress(url: string, onProgress: (loaded: number, total: number) => void) {
  const response = await fetch(url)
  const total = Number(response.headers.get('content-length'))
  const reader = response.body!.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    chunks.push(value)
    loaded += value.length
    onProgress(loaded, total)
  }

  const buffer = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }
  return buffer.buffer
}

globalThis.onmessage = async (e: MessageEvent<{ maxImages: number }>) => {
  try {
    const { maxImages } = e.data

    postMessage({ type: 'progress', stage: 'fetching', progress: 0, loaded: 0, total: 0 } as LoadProgress)

    let imagesLoaded = 0
    let labelsLoaded = 0
    let imagesTotal = 0
    let labelsTotal = 0
    const updateProgress = () => {
      const loaded = imagesLoaded + labelsLoaded
      const total = imagesTotal + labelsTotal
      const progress = total > 0 ? (loaded / total) * 100 : 0
      postMessage({ type: 'progress', stage: 'fetching', progress, loaded, total } as LoadProgress)
    }

    const [imagesBuffer, labelsBuffer] = await Promise.all([
      fetchWithProgress('https://iot.ipalmap.com/uploads/data/train-images-idx3-ubyte', (loaded, total) => {
        imagesLoaded = loaded
        imagesTotal = total
        updateProgress()
      }),
      fetchWithProgress('https://iot.ipalmap.com/uploads/data/train-labels-idx1-ubyte', (loaded, total) => {
        labelsLoaded = loaded
        labelsTotal = total
        updateProgress()
      }),
    ])

    postMessage({ type: 'progress', stage: 'fetching', progress: 100 } as LoadProgress)
    postMessage({ type: 'progress', stage: 'parsing', progress: 0 } as LoadProgress)

    const imagesData = new Uint8Array(imagesBuffer)
    const labelsData = new Uint8Array(labelsBuffer)

    const numImages = Math.min(maxImages, (imagesData.length - 16) / 784)
    const images = new Float32Array(numImages * 784)
    const labels = new Uint8Array(numImages)

    const imageOffset = 16
    const labelOffset = 8

    for (let i = 0; i < numImages; i++) {
      const imageStart = imageOffset + i * 784
      for (let j = 0; j < 784; j++)
        images[i * 784 + j] = imagesData[imageStart + j] / 255

      labels[i] = labelsData[labelOffset + i]

      if (i % 500 === 0)
        postMessage({ type: 'progress', stage: 'parsing', progress: (i / numImages) * 100 } as LoadProgress)
    }

    postMessage({ type: 'progress', stage: 'parsing', progress: 100 } as LoadProgress)
    postMessage({ type: 'complete', images, labels, numImages } as LoadComplete, { transfer: [images.buffer, labels.buffer] })
  }
  catch (error) {
    postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) } as LoadError)
  }
}
