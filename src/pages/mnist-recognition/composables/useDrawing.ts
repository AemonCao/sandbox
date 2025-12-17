import type { Ref } from 'vue'

// 复用临时 canvas
let tempCanvas: HTMLCanvasElement | null = null
let tempCtx: CanvasRenderingContext2D | null = null

export function useDrawing(canvasRef: Ref<HTMLCanvasElement | null>) {
  const isDrawing = ref(false)
  const ctx = computed(() => canvasRef.value?.getContext('2d'))

  function handleMouseDown(e: MouseEvent) {
    if (!ctx.value)
      return
    isDrawing.value = true
    const rect = canvasRef.value!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.value.beginPath()
    ctx.value.moveTo(x, y)
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
  }

  function clear() {
    if (!ctx.value || !canvasRef.value)
      return
    ctx.value.fillStyle = '#000'
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

  function getImageData(): number[] {
    if (!canvasRef.value || isCanvasEmpty())
      return []

    if (!tempCanvas) {
      tempCanvas = document.createElement('canvas')
      tempCanvas.width = 28
      tempCanvas.height = 28
      tempCtx = tempCanvas.getContext('2d')!
    }

    tempCtx!.fillStyle = '#000'
    tempCtx!.fillRect(0, 0, 28, 28)
    tempCtx!.drawImage(canvasRef.value, 0, 0, 28, 28)

    const imageData = tempCtx!.getImageData(0, 0, 28, 28)
    const grayscale: number[] = []

    for (let i = 0; i < imageData.data.length; i += 4)
      grayscale.push(imageData.data[i])

    return grayscale
  }

  function initCanvas() {
    if (!ctx.value || !canvasRef.value)
      return
    ctx.value.fillStyle = '#000'
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.value.strokeStyle = '#fff'
    ctx.value.lineWidth = 20
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
  }

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
