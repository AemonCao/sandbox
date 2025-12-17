import type { Ref } from 'vue'

// 复用临时 canvas
let tempCanvas: HTMLCanvasElement | null = null
let tempCtx: CanvasRenderingContext2D | null = null

export function useDrawing(canvasRef: Ref<HTMLCanvasElement | null>) {
  const isDrawing = ref(false)
  const ctx = computed(() => canvasRef.value?.getContext('2d'))
  const isDark = useDark()

  function handleMouseDown(e: MouseEvent) {
    if (!ctx.value)
      return
    isDrawing.value = true
    const rect = canvasRef.value!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.value.beginPath()
    ctx.value.moveTo(x, y)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDrawing.value || !ctx.value)
      return
    const rect = canvasRef.value!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
  }

  function handleMouseUp() {
    isDrawing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  function clear() {
    if (!ctx.value || !canvasRef.value)
      return
    ctx.value.fillStyle = isDark.value ? '#fff' : '#000'
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }

  function isCanvasEmpty(): boolean {
    if (!canvasRef.value)
      return true

    const ctx = canvasRef.value.getContext('2d')
    if (!ctx)
      return true

    const imageData = ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    return imageData.data.every((value, index) => index % 4 === 3 || value === 0)
  }

  function getImageData(): { data: number[], imageData28: ImageData | null } {
    if (!canvasRef.value || isCanvasEmpty())
      return { data: [], imageData28: null }

    if (!tempCanvas) {
      tempCanvas = document.createElement('canvas')
      tempCanvas.width = 28
      tempCanvas.height = 28
      tempCtx = tempCanvas.getContext('2d')!
    }

    tempCtx!.fillStyle = isDark.value ? '#fff' : '#000'
    tempCtx!.fillRect(0, 0, 28, 28)
    tempCtx!.drawImage(canvasRef.value, 0, 0, 28, 28)

    const imageData = tempCtx!.getImageData(0, 0, 28, 28)
    const grayscale: number[] = []

    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = isDark.value ? 255 - imageData.data[i] : imageData.data[i]
      grayscale.push(value)
    }

    return { data: grayscale, imageData28: imageData }
  }

  function initCanvas() {
    if (!ctx.value || !canvasRef.value)
      return
    ctx.value.fillStyle = isDark.value ? '#fff' : '#000'
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.value.strokeStyle = isDark.value ? '#000' : '#fff'
    ctx.value.lineWidth = 20
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
  }

  watch(isDark, () => {
    if (!canvasRef.value || !ctx.value)
      return

    const imageData = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i]
      imageData.data[i + 1] = 255 - imageData.data[i + 1]
      imageData.data[i + 2] = 255 - imageData.data[i + 2]
    }

    ctx.value.fillStyle = isDark.value ? '#fff' : '#000'
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.value.putImageData(imageData, 0, 0)
    ctx.value.strokeStyle = isDark.value ? '#000' : '#fff'
  })

  onUnmounted(() => {
    tempCanvas = null
    tempCtx = null
  })

  return {
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clear,
    getImageData,
    initCanvas,
  }
}
