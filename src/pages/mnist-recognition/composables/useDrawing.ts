import type { Ref } from 'vue'

// 复用临时 canvas
let tempCanvas: HTMLCanvasElement | null = null
let tempCtx: CanvasRenderingContext2D | null = null

export function useDrawing(canvasRef: Ref<HTMLCanvasElement | null>) {
  const isDrawing = ref(false)
  const isErasing = ref(false)
  const brushSize = ref(20)
  const cursorPos = ref({ x: 0, y: 0 })
  const showCursor = ref(false)
  const ctx = computed(() => canvasRef.value?.getContext('2d'))
  const isDark = useDark()

  function getCoordinates(e: MouseEvent | TouchEvent) {
    const rect = canvasRef.value!.getBoundingClientRect()
    const scaleX = canvasRef.value!.width / rect.width
    const scaleY = canvasRef.value!.height / rect.height

    if (e instanceof TouchEvent) {
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handleMouseDown(e: MouseEvent | TouchEvent) {
    if (!ctx.value)
      return
    e.preventDefault()

    if (e instanceof MouseEvent && e.button === 2) {
      isErasing.value = true
      ctx.value.strokeStyle = isDark.value ? '#fff' : '#000'
    }
    else {
      isErasing.value = false
      ctx.value.strokeStyle = isDark.value ? '#000' : '#fff'
    }

    isDrawing.value = true
    const { x, y } = getCoordinates(e)
    ctx.value.beginPath()
    ctx.value.moveTo(x, y)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleMouseMove)
    document.addEventListener('touchend', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent | TouchEvent) {
    if (!isDrawing.value || !ctx.value)
      return
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
  }

  function handleMouseUp() {
    isDrawing.value = false
    if (isErasing.value && ctx.value) {
      isErasing.value = false
      ctx.value.strokeStyle = isDark.value ? '#000' : '#fff'
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleMouseMove)
    document.removeEventListener('touchend', handleMouseUp)
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

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -2 : 2
    brushSize.value = Math.max(5, Math.min(50, brushSize.value + delta))
    if (ctx.value)
      ctx.value.lineWidth = brushSize.value
  }

  function handleMouseEnter() {
    showCursor.value = true
  }

  function handleMouseLeave() {
    showCursor.value = false
  }

  function handleCursorMove(e: MouseEvent) {
    const { x, y } = getCoordinates(e)
    cursorPos.value = { x, y }
  }

  function initCanvas() {
    if (!ctx.value || !canvasRef.value)
      return
    ctx.value.fillStyle = isDark.value ? '#fff' : '#000'
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    ctx.value.strokeStyle = isDark.value ? '#000' : '#fff'
    ctx.value.lineWidth = brushSize.value
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
    handleWheel,
    handleMouseEnter,
    handleMouseLeave,
    handleCursorMove,
    clear,
    getImageData,
    initCanvas,
    brushSize,
    cursorPos,
    showCursor,
  }
}
