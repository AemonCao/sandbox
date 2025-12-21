export interface LoadProgress {
  type: 'progress'
  stage: 'fetching' | 'parsing'
  progress: number
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

globalThis.onmessage = async (e: MessageEvent<{ maxImages: number }>) => {
  try {
    const { maxImages } = e.data

    postMessage({ type: 'progress', stage: 'fetching', progress: 0 } as LoadProgress)

    const [imagesBuffer, labelsBuffer] = await Promise.all([
      fetch('https://iot.ipalmap.com/uploads/data/train-images-idx3-ubyte').then(r => r.arrayBuffer()),
      fetch('https://iot.ipalmap.com/uploads/data/train-labels-idx1-ubyte').then(r => r.arrayBuffer()),
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
