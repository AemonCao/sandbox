<script setup lang="ts">
import type { Beacon, Client } from '../composables/types'
import { nextTick, onMounted, watch } from 'vue'
import { useCanvas } from '../composables/useCanvas'

interface Props {
  beacons: Beacon[]
  clients: Client[]
  selectedObject: Beacon | Client | null
  selectedObjects: (Beacon | Client)[]
  clientHeight: number
  clientRssiThreshold: number
  beaconN: number
  showCoverageArea: boolean
  coverageStep: number
  scale: number
}

interface Emits {
  (e: 'objectClick', object: Beacon | Client | null): void
  (e: 'objectDrag', object: Beacon | Client, deltaX: number, deltaY: number): void
  (e: 'multiSelect', objects: (Beacon | Client)[]): void
  (e: 'clearSelection'): void
  (e: 'deleteObject', object: Beacon | Client): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  canvasRef,
  gridCanvasRef,
  canvasContainerRef,
  isDragging,
  isBoxSelecting,
  dragOffsetX,
  dragOffsetY,
  boxSelection,
  coverageAreaCache,
  resizeCanvas,
  drawGrid,
  draw,
  getObjectAt,
  getObjectsInBox,
} = useCanvas()

// 动画帧ID
let animationFrameId: number | null = null

// 拖拽相关的状态
interface DragState {
  object: Beacon | Client
  startX: number
  startY: number
}

let dragStartObjects: DragState[] = []
let dragStartX = 0
let dragStartY = 0

// 绘制函数
function redraw(): void {
  draw(
    props.beacons,
    props.clients,
    props.selectedObject,
    props.selectedObjects,
    props.clientHeight,
    props.clientRssiThreshold,
    props.beaconN,
    props.showCoverageArea,
    props.coverageStep,
    props.scale,
  )
}

// 监听变化重绘
watch([
  () => props.beacons,
  () => props.clients,
  () => props.selectedObject,
  () => props.selectedObjects,
  () => props.clientHeight,
  () => props.clientRssiThreshold,
  () => props.beaconN,
  () => props.showCoverageArea,
  () => props.coverageStep,
  () => props.scale,
], () => {
  nextTick(() => {
    redraw()
  })
}, { deep: true })

// 鼠标事件处理
function handleMouseDown(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  // 如果按住Ctrl键（Mac）或Meta键，添加到多选
  const isCtrlPressed = e.ctrlKey || e.metaKey
  const clickedObject = getObjectAt(mouseX, mouseY, props.beacons, props.clients)

  if (clickedObject) {
    if (isCtrlPressed) {
      emit('objectClick', clickedObject) // 由父组件处理多选逻辑
    }
    else {
      // 普通点击 - 先设置拖拽状态，再决定是否需要更新选择
      isDragging.value = true
      canvas.style.cursor = 'grabbing'

      // 检查点击的对象是否已在选中列表中
      const isInSelectedObjects = props.selectedObjects.some(obj =>
        obj.id === clickedObject.id && obj.type === clickedObject.type,
      )
      const isCurrentSingleSelection = props.selectedObject
        && props.selectedObject.id === clickedObject.id
        && props.selectedObject.type === clickedObject.type

      if (!isInSelectedObjects && !isCurrentSingleSelection) {
        // 点击的对象不在选中列表中，更新选择
        emit('objectClick', clickedObject)
      }

      // 记录拖拽开始时的状态
      dragStartX = mouseX
      dragStartY = mouseY

      // 使用延迟来确保选择状态已更新
      nextTick(() => {
        if (props.selectedObjects.length > 0) {
          // 多选拖拽，记录所有对象的初始位置
          dragStartObjects = props.selectedObjects.map(obj => ({
            object: obj,
            startX: obj.x,
            startY: obj.y,
          }))
        }
        else if (props.selectedObject) {
          // 单选拖拽
          dragStartObjects = [{
            object: props.selectedObject,
            startX: props.selectedObject.x,
            startY: props.selectedObject.y,
          }]
          dragOffsetX.value = mouseX - props.selectedObject.x
          dragOffsetY.value = mouseY - props.selectedObject.y
        }
      })
    }
  }
  else {
    // 点击空白区域：开始框选或清除选择
    if (!isCtrlPressed) {
      emit('clearSelection')
    }

    isBoxSelecting.value = true
    boxSelection.value = {
      startX: mouseX,
      startY: mouseY,
      endX: mouseX,
      endY: mouseY,
      isActive: true,
    }
    canvas.style.cursor = 'crosshair'
  }

  redraw()
}

function handleMouseMove(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  if (isDragging.value && dragStartObjects.length > 0) {
    const deltaX = mouseX - dragStartX
    const deltaY = mouseY - dragStartY

    // 检查是否拖拽了信标
    const hasBeacons = dragStartObjects.some(item => item.object.type === 'beacon')

    if (hasBeacons) {
      // 清除覆盖范围缓存
      coverageAreaCache.value.canvas = null
    }

    if (props.selectedObjects.length > 0) {
      // 多选拖拽 - 直接在组件内更新所有选中对象的位置
      dragStartObjects.forEach((dragState) => {
        const currentObj = props.selectedObjects.find(obj =>
          obj.id === dragState.object.id && obj.type === dragState.object.type,
        )
        if (currentObj) {
          currentObj.x = dragState.startX + deltaX
          currentObj.y = dragState.startY + deltaY
        }
      })
    }
    else if (props.selectedObject) {
      // 单选拖拽
      emit('objectDrag', props.selectedObject, deltaX, deltaY)
    }

    // 使用requestAnimationFrame优化拖拽重绘
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    animationFrameId = requestAnimationFrame(() => {
      redraw()
      animationFrameId = null
    })
  }
  else if (isBoxSelecting.value) {
    // 更新框选矩形
    boxSelection.value.endX = mouseX
    boxSelection.value.endY = mouseY
    redraw()
  }
}

function handleMouseUp(): void {
  const canvas = canvasRef.value

  if (isBoxSelecting.value) {
    // 完成框选
    const objectsInBox = getObjectsInBox(
      boxSelection.value.startX,
      boxSelection.value.startY,
      boxSelection.value.endX,
      boxSelection.value.endY,
      props.beacons,
      props.clients,
    )

    if (objectsInBox.length > 0) {
      emit('multiSelect', objectsInBox)
    }

    // 重置框选状态
    isBoxSelecting.value = false
    boxSelection.value.isActive = false
  }

  // 重置拖拽状态
  isDragging.value = false
  dragStartObjects = []
  dragStartX = 0
  dragStartY = 0

  if (canvas) {
    canvas.style.cursor = 'grab'
  }

  // 清理动画帧
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function handleDoubleClick(e: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const objectToDelete = getObjectAt(mouseX, mouseY, props.beacons, props.clients)

  if (objectToDelete) {
    emit('deleteObject', objectToDelete)
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if ((e.target as HTMLElement).tagName === 'INPUT')
    return

  if ((e.key === 'Delete' || e.key === 'Backspace') && (props.selectedObject || props.selectedObjects.length > 0)) {
    e.preventDefault()
    if (props.selectedObject) {
      emit('deleteObject', props.selectedObject)
    }
  }

  // ESC键清除选择
  if (e.key === 'Escape') {
    emit('clearSelection')
  }
}

// 窗口大小变化
function handleResize(): void {
  resizeCanvas()
  drawGrid(props.scale)
  redraw()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    resizeCanvas()
    drawGrid(props.scale)

    const canvas = canvasRef.value
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('mouseleave', handleMouseUp)
      canvas.addEventListener('dblclick', handleDoubleClick)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    redraw()
  })
})
</script>

<template>
  <div :ref="(el) => canvasContainerRef = el as HTMLElement" class="canvas-container">
    <!-- 网格层 -->
    <canvas
      :ref="(el) => gridCanvasRef = el as HTMLCanvasElement"
      class="grid-canvas"
      style="pointer-events: none; position: absolute; left: 8px; top: 8px;"
    />
    <!-- 动态元素层 -->
    <canvas
      ref="canvasRef"
      class="main-canvas"
      style="background: transparent; cursor: grab; position: relative;"
    />
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.main-canvas,
.grid-canvas {
  touch-action: none;
}
</style>
