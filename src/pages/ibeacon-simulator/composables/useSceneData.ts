import type { Beacon, Client, SceneData } from './types'
import { computed, ref } from 'vue'

export function useSceneData() {
  // 响应式状态
  const beacons = ref<Beacon[]>([])
  const clients = ref<Client[]>([])
  const selectedObject = ref<Beacon | Client | null>(null)
  const selectedObjects = ref<(Beacon | Client)[]>([])
  const nextBeaconId = ref(1)
  const nextClientId = ref(1)

  // 配置参数
  const scale = ref(50)
  const beaconHeight = ref(3)
  const clientHeight = ref(0.8)
  const beaconN = ref(2.5)
  const clientRssiThreshold = ref(-85)
  const showCoverageArea = ref(false)
  const coverageStep = ref(10)

  // 场景数据计算属性
  const sceneData = computed((): SceneData => ({
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
  }))

  // 清除选择
  function clearSelection(): void {
    selectedObjects.value = []
    selectedObject.value = null
  }

  // 设置多选状态
  function setMultiSelection(objects: (Beacon | Client)[]): void {
    selectedObjects.value = objects
    if (objects.length === 1) {
      selectedObject.value = objects[0]
    }
    else {
      selectedObject.value = null
    }
  }

  // 添加信标
  function addBeacon(): void {
    const newBeacon: Beacon = {
      id: nextBeaconId.value++,
      type: 'beacon',
      x: 50,
      y: 50,
      z: beaconHeight.value,
      txPower: -59,
    }
    beacons.value.push(newBeacon)
  }

  // 添加客户端
  function addClient(): void {
    const newClient: Client = {
      id: nextClientId.value++,
      type: 'client',
      x: 100,
      y: 100,
      z: clientHeight.value,
    }
    clients.value.push(newClient)
  }

  // 清除所有
  function clearAll(): void {
    beacons.value = []
    clients.value = []
    selectedObject.value = null
    nextBeaconId.value = 1
    nextClientId.value = 1
  }

  // 删除对象
  function deleteObject(obj: Beacon | Client | null): void {
    if (!obj)
      return

    if (obj.type === 'beacon') {
      beacons.value = beacons.value.filter(b => b.id !== obj.id)
    }
    else if (obj.type === 'client') {
      clients.value = clients.value.filter(c => c.id !== obj.id)
    }

    if (selectedObject.value
      && selectedObject.value.id === obj.id
      && selectedObject.value.type === obj.type) {
      selectedObject.value = null
    }

    selectedObjects.value = selectedObjects.value.filter(selectedObj =>
      !(selectedObj.id === obj.id && selectedObj.type === obj.type),
    )
  }

  // 删除多个对象
  function deleteMultipleObjects(objects: (Beacon | Client)[]): void {
    if (!objects || objects.length === 0)
      return

    objects.forEach((obj) => {
      if (obj.type === 'beacon') {
        beacons.value = beacons.value.filter(b => b.id !== obj.id)
      }
      else if (obj.type === 'client') {
        clients.value = clients.value.filter(c => c.id !== obj.id)
      }
    })

    clearSelection()
  }

  // 更新所有信标高度
  function updateAllBeaconsHeight(): void {
    if (beacons.value.length === 0)
      return

    beacons.value.forEach((beacon) => {
      beacon.z = beaconHeight.value
    })
  }

  // 更新所有客户端高度
  function updateAllClientsHeight(): void {
    if (clients.value.length === 0)
      return

    clients.value.forEach((client) => {
      client.z = clientHeight.value
    })
  }

  // 场景居中
  function centerScene(): void {
    const allObjects = [...beacons.value, ...clients.value]
    if (allObjects.length === 0)
      return

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    allObjects.forEach((obj) => {
      minX = Math.min(minX, obj.x)
      maxX = Math.max(maxX, obj.x)
      minY = Math.min(minY, obj.y)
      maxY = Math.max(maxY, obj.y)
    })

    const sceneCenterX = (minX + maxX) / 2
    const sceneCenterY = (minY + maxY) / 2

    const centerX = 400 // 假设画布中心在400,300
    const centerY = 300
    const offsetX = centerX - sceneCenterX
    const offsetY = centerY - sceneCenterY

    allObjects.forEach((obj) => {
      obj.x += offsetX
      obj.y += offsetY
    })
  }

  return {
    // 状态
    beacons,
    clients,
    selectedObject,
    selectedObjects,
    nextBeaconId,
    nextClientId,

    // 配置
    scale,
    beaconHeight,
    clientHeight,
    beaconN,
    clientRssiThreshold,
    showCoverageArea,
    coverageStep,

    // 计算属性
    sceneData,

    // 方法
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
  }
}
