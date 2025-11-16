<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { isDark } from '~/composables'
import BeaconCanvas from './components/BeaconCanvas.vue'
import ControlPanel from './components/ControlPanel.vue'
import FormulaPanel from './components/FormulaPanel.vue'
import InfoPanel from './components/InfoPanel.vue'
import MessageAlert from './components/MessageAlert.vue'
import { useFormulaPanel } from './composables/useFormulaPanel'
import { useInfoPanel } from './composables/useInfoPanel'
import { usePresetScenes } from './composables/usePresetScenes'
import { useSceneData } from './composables/useSceneData'

// 使用composables管理状态
const {
  beacons,
  clients,
  selectedObject,
  selectedObjects,
  scale,
  beaconHeight,
  clientHeight,
  beaconN,
  clientRssiThreshold,
  showCoverageArea,
  coverageStep,
  clearSelection,
  setMultiSelection,
  addBeacon,
  addClient,
  clearAll,
  deleteObject,
  deleteMultipleObjects,
  updateAllBeaconsHeight,
  updateAllClientsHeight,
  centerScene,
} = useSceneData()
// 使用预设场景
const { loadPresetScene: loadPresetSceneFromComposable } = usePresetScenes()

// 使用面板数据
const { infoPanelData } = useInfoPanel(
  selectedObject,
  selectedObjects,
  beacons,
  clients,
  scale,
  clientRssiThreshold,
  beaconN,
)

const { formulaPanelData } = useFormulaPanel(
  selectedObject,
  beacons,
  clientRssiThreshold,
  beaconN,
)

// 消息提示状态
const messageInfo = ref({
  content: '',
  type: 'info' as 'info' | 'success' | 'warning' | 'error',
  show: false,
})

// 画布占比
const splitSize = ref(0.75)

// 消息提示函数
function showMessage(content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  messageInfo.value = {
    content,
    type,
    show: true,
  }
  setTimeout(() => {
    messageInfo.value.show = false
  }, 3000)
}

function showError(message: string): void {
  showMessage(message, 'error')
}

function showSuccess(message: string): void {
  showMessage(message, 'success')
}

// 画布事件处理
function handleObjectClick(object: any): void {
  if (!object) {
    clearSelection()
    return
  }

  // 检查是否是多选（Ctrl/Cmd点击）
  const existingIndex = selectedObjects.value.findIndex(obj =>
    obj.id === object.id && obj.type === object.type,
  )

  if (existingIndex >= 0) {
    // 已选中，移除
    selectedObjects.value.splice(existingIndex, 1)
  }
  else {
    // 未选中，添加到多选
    selectedObjects.value.push(object)
  }

  setMultiSelection(selectedObjects.value)
}

function handleObjectDrag(object: any, deltaX: number, deltaY: number): void {
  if (selectedObjects.value.length > 1) {
    // 多选拖拽 - 移动所有选中的对象
    selectedObjects.value.forEach((obj) => {
      obj.x += deltaX
      obj.y += deltaY
    })
  }
  else {
    // 单选拖拽
    object.x += deltaX
    object.y += deltaY
  }
}

function handleMultiSelect(objects: any[]): void {
  setMultiSelection(objects)
}

function handleObjectDelete(object: any): void {
  deleteObject(object)
}

// 控制面板事件处理
function handleClearSelection(): void {
  clearSelection()
}

function handleDeleteSelected(): void {
  if (selectedObjects.value.length > 0) {
    deleteMultipleObjects(selectedObjects.value)
  }
  else if (selectedObject.value) {
    deleteObject(selectedObject.value)
  }
}

// 数据导入导出功能
function exportScene(): void {
  try {
    const sceneData = {
      beacons: beacons.value,
      clients: clients.value,
      settings: {
        scale: scale.value,
        beaconHeight: beaconHeight.value,
        clientHeight: clientHeight.value,
        beaconN: beaconN.value,
        clientRssiThreshold: clientRssiThreshold.value,
        showCoverageArea: showCoverageArea.value,
        coverageStep: coverageStep.value,
      },
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        name: 'iBeacon模拟器场景',
      },
    }

    const dataStr = JSON.stringify(sceneData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ibeacon-scene-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    showSuccess('场景已成功导出！')
  }
  catch (error) {
    console.error('导出场景失败:', error)
    showError('导出场景失败，请重试')
  }
}

function importScene(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // 验证数据格式
        if (!data.beacons || !data.clients || !data.settings) {
          throw new Error('无效的场景数据格式')
        }

        // 加载数据
        beacons.value = data.beacons || []
        clients.value = data.clients || []

        if (data.settings) {
          scale.value = data.settings.scale || 50
          beaconHeight.value = data.settings.beaconHeight || 3
          clientHeight.value = data.settings.clientHeight || 0.8
          beaconN.value = data.settings.beaconN || 2.5
          clientRssiThreshold.value = data.settings.clientRssiThreshold || -85
          showCoverageArea.value = data.settings.showCoverageArea || false
          coverageStep.value = data.settings.coverageStep || 10
        }

        selectedObject.value = null
        selectedObjects.value = []

        nextTick(() => {
          // 获取画布实际尺寸并居中场景
          const canvasElement = document.querySelector('.main-canvas') as HTMLCanvasElement
          if (canvasElement) {
            centerScene(canvasElement.width, canvasElement.height)
          }
          else {
            centerScene()
          }
        })

        showSuccess('场景已成功导入！')
      }
      catch (error) {
        console.error('导入场景失败:', error)
        showError('导入场景失败，请检查文件格式')
      }
    }

    reader.readAsText(file)
  }

  input.click()
}

// 加载预设场景
function loadPresetScene(sceneType: string): void {
  loadPresetSceneFromComposable(sceneType, {
    clearAll: () => {
      beacons.value = []
      clients.value = []
      selectedObject.value = null
      selectedObjects.value = []
    },
    setBeacons: (newBeacons) => { beacons.value = newBeacons },
    setClients: (newClients) => { clients.value = newClients },
    setScale: (newScale) => { scale.value = newScale },
    setBeaconHeight: (newHeight) => { beaconHeight.value = newHeight },
    setClientHeight: (newHeight) => { clientHeight.value = newHeight },
    setBeaconN: (newN) => { beaconN.value = newN },
    setClientRssiThreshold: (newThreshold) => { clientRssiThreshold.value = newThreshold },
    setShowCoverageArea: (show) => { showCoverageArea.value = show },
    setCoverageStep: (newStep) => { coverageStep.value = newStep },
    centerScene: () => {
      nextTick(() => {
        // 获取画布实际尺寸并居中场景
        const canvasElement = document.querySelector('.main-canvas') as HTMLCanvasElement
        if (canvasElement) {
          centerScene(canvasElement.width, canvasElement.height)
        }
        else {
          centerScene()
        }
      })
    },
    showSuccess: (message) => { showSuccess(message) },
    showError: (message) => { showError(message) },
  })
}

// 本地存储功能
function saveToLocalStorage(): void {
  try {
    const sceneData = {
      beacons: beacons.value,
      clients: clients.value,
      settings: {
        scale: scale.value,
        beaconHeight: beaconHeight.value,
        clientHeight: clientHeight.value,
        beaconN: beaconN.value,
        clientRssiThreshold: clientRssiThreshold.value,
        showCoverageArea: showCoverageArea.value,
        coverageStep: coverageStep.value,
      },
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        name: 'iBeacon模拟器场景',
      },
    }
    localStorage.setItem('ibeacon-scene', JSON.stringify(sceneData))
    localStorage.setItem('ibeacon-scene-timestamp', new Date().toISOString())
  }
  catch (error) {
    console.error('自动保存失败:', error)
  }
}

function loadFromLocalStorage(): void {
  try {
    const savedData = localStorage.getItem('ibeacon-scene')
    if (!savedData)
      return

    const data = JSON.parse(savedData)

    // 检查数据是否过期（7天）
    const timestamp = localStorage.getItem('ibeacon-scene-timestamp')
    if (timestamp) {
      const savedTime = new Date(timestamp)
      const now = new Date()
      const daysDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 7) {
        localStorage.removeItem('ibeacon-scene')
        localStorage.removeItem('ibeacon-scene-timestamp')
        return
      }
    }

    // 加载数据
    beacons.value = data.beacons || []
    clients.value = data.clients || []

    if (data.settings) {
      scale.value = data.settings.scale || 50
      beaconHeight.value = data.settings.beaconHeight || 3
      clientHeight.value = data.settings.clientHeight || 0.8
      beaconN.value = data.settings.beaconN || 2.5
      clientRssiThreshold.value = data.settings.clientRssiThreshold || -85
      showCoverageArea.value = data.settings.showCoverageArea || false
      coverageStep.value = data.settings.coverageStep || 10
    }

    selectedObject.value = null
    selectedObjects.value = []

    nextTick(() => {
      // 获取画布实际尺寸并居中场景
      const canvasElement = document.querySelector('.main-canvas') as HTMLCanvasElement
      if (canvasElement) {
        centerScene(canvasElement.width, canvasElement.height)
      }
      else {
        centerScene()
      }
    })
  }
  catch (error) {
    console.error('加载本地存储失败:', error)
  }
}

// 监听数据变化自动保存
watch([beacons, clients, scale, beaconHeight, clientHeight, beaconN, clientRssiThreshold, showCoverageArea, coverageStep], () => {
  saveToLocalStorage()
}, { deep: true })

// 监听主题变化
watch(isDark, () => {
  nextTick(() => {
    // 可以在这里触发画布重绘
  })
})

// 生命周期
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<template>
  <div bg-gray-100 h-screen overflow-hidden dark:bg-gray-900>
    <!-- 消息提示 -->
    <MessageAlert
      :message-info="messageInfo"
      @close="messageInfo.show = false"
    />

    <NSplit
      direction="horizontal"
      :min="0.5"
      :max="0.9"
      :default-size="splitSize"
      :on-update:size="(size: number) => { splitSize = size }"
      class="h-full"
    >
      <!-- 画布容器 -->
      <template #1>
        <div p-2 h-full>
          <div rounded-lg bg-white flex h-full shadow-md items-center justify-center relative dark:bg-gray-800 dark:shadow-gray-700>
            <BeaconCanvas
              :beacons="beacons"
              :clients="clients"
              :selected-object="selectedObject"
              :selected-objects="selectedObjects"
              :client-height="clientHeight"
              :client-rssi-threshold="clientRssiThreshold"
              :beacon-n="beaconN"
              :show-coverage-area="showCoverageArea"
              :coverage-step="coverageStep"
              :scale="scale"
              @object-click="handleObjectClick"
              @object-drag="handleObjectDrag"
              @multi-select="handleMultiSelect"
              @clear-selection="handleClearSelection"
              @delete-object="handleObjectDelete"
            />
          </div>
        </div>
      </template>

      <!-- 控制面板 -->
      <template #2>
        <div p-5 h-full overflow-y-auto>
          <!-- 控制面板 -->
          <ControlPanel
            :scale="scale"
            :beacon-height="beaconHeight"
            :client-height="clientHeight"
            :beacon-n="beaconN"
            :client-rssi-threshold="clientRssiThreshold"
            :show-coverage-area="showCoverageArea"
            :coverage-step="coverageStep"
            :beacons-count="beacons.length"
            :clients-count="clients.length"
            :has-selected-objects="selectedObjects.length > 0 || !!selectedObject"
            @update:scale="scale = $event"
            @update:beacon-height="beaconHeight = $event"
            @update:client-height="clientHeight = $event"
            @update:beacon-n="beaconN = $event"
            @update:client-rssi-threshold="clientRssiThreshold = $event"
            @update:show-coverage-area="showCoverageArea = $event"
            @update:coverage-step="coverageStep = $event"
            @add-beacon="addBeacon"
            @add-client="addClient"
            @clear-all="clearAll"
            @clear-selection="handleClearSelection"
            @delete-selected="handleDeleteSelected"
            @update-all-beacons-height="updateAllBeaconsHeight"
            @update-all-clients-height="updateAllClientsHeight"
            @export-scene="exportScene"
            @import-scene="importScene"
            @load-preset="loadPresetScene"
          />

          <!-- 信息面板 -->
          <InfoPanel
            :info-panel-data="infoPanelData"
          />

          <!-- 公式面板 -->
          <FormulaPanel
            :formula-panel-data="formulaPanelData"
          />
        </div>
      </template>
    </NSplit>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '室内蓝牙定位模拟器 (三角定位)'
</route>
