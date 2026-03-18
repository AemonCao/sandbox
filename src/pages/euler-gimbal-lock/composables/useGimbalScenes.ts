import type { EulerAnglesState, GimbalStatus, SceneTheme } from './types'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { computeAxisAlignment, degreesToRadians } from './gimbalMath'

interface SceneController {
  init: () => void
  update: (angles: EulerAnglesState, status: GimbalStatus, theme: SceneTheme) => void
  handleResize: () => void
  dispose: () => void
}

function color(value: string) {
  return new THREE.Color(value)
}

function lineMaterial(hex: string) {
  return new THREE.LineBasicMaterial({
    color: color(hex),
    transparent: true,
    opacity: 0.95,
  })
}

function createAxisLine(direction: THREE.Vector3, length: number, hex: string) {
  const points = [
    direction.clone().multiplyScalar(-length / 2),
    direction.clone().multiplyScalar(length / 2),
  ]
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geometry, lineMaterial(hex))
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.geometry)
      mesh.geometry.dispose()

    const material = mesh.material
    if (!material)
      return

    if (Array.isArray(material))
      material.forEach(item => item.dispose())
    else
      material.dispose()
  })
}

function createBaseStage(
  canvas: HTMLCanvasElement,
  cameraPosition: THREE.Vector3,
  cameraTarget: THREE.Vector3,
) {
  let animationId = 0
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.copy(cameraPosition)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.copy(cameraTarget)
  controls.minDistance = 4
  controls.maxDistance = 18

  const grid = new THREE.GridHelper(10, 20)
  scene.add(grid)

  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.1)
  keyLight.position.set(5, 7, 4)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
  rimLight.position.set(-4, 3, -5)
  scene.add(rimLight)

  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  function handleResize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height)
      return

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  function applyTheme(theme: SceneTheme) {
    scene.background = color(theme.background)
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material]
    materials[0]?.color.set(theme.gridPrimary)
    materials[1]?.color.set(theme.gridSecondary)
  }

  return {
    scene,
    controls,
    init() {
      handleResize()
      animate()
    },
    handleResize,
    applyTheme,
    dispose() {
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
    },
  }
}

function createPayload(theme: SceneTheme) {
  const payload = new THREE.Group()
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: color(theme.payload),
    roughness: 0.35,
    metalness: 0.15,
  })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: color(theme.payloadAccent),
    roughness: 0.3,
    metalness: 0.1,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.5), bodyMaterial)
  payload.add(body)

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 24), accentMaterial)
  nose.rotation.x = Math.PI / 2
  nose.position.z = 1.1
  payload.add(nose)

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.45), accentMaterial)
  fin.position.set(0, 0.45, -0.3)
  payload.add(fin)

  payload.add(new THREE.AxesHelper(1.6))

  return {
    group: payload,
    bodyMaterial,
    accentMaterial,
  }
}

export function createGimbalScene(canvas: HTMLCanvasElement): SceneController {
  const stage = createBaseStage(
    canvas,
    new THREE.Vector3(5.2, 4.4, 6.2),
    new THREE.Vector3(0, 0.5, 0),
  )

  const root = new THREE.Group()
  const outerYawGroup = new THREE.Group()
  const middlePitchGroup = new THREE.Group()
  const innerRollGroup = new THREE.Group()

  const outerRingMaterial = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.2 })
  const middleRingMaterial = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.2 })
  const innerRingMaterial = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.2 })

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.07, 24, 120), outerRingMaterial)
  outerRing.rotation.x = Math.PI / 2
  outerYawGroup.add(outerRing)
  const yawLine = createAxisLine(new THREE.Vector3(0, 1, 0), 4.8, '#2563eb')
  outerYawGroup.add(yawLine)

  const middleRing = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.07, 24, 100), middleRingMaterial)
  middleRing.rotation.y = Math.PI / 2
  middlePitchGroup.add(middleRing)
  const pitchLine = createAxisLine(new THREE.Vector3(1, 0, 0), 3.4, '#14b8a6')
  middlePitchGroup.add(pitchLine)

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.07, 24, 90), innerRingMaterial)
  innerRollGroup.add(innerRing)
  const rollLine = createAxisLine(new THREE.Vector3(0, 0, 1), 2.2, '#f97316')
  innerRollGroup.add(rollLine)

  const payload = createPayload({
    background: '#ffffff',
    panelOverlay: '#ffffff',
    gridPrimary: '#d6def6',
    gridSecondary: '#e8eefc',
    payload: '#1d4ed8',
    payloadAccent: '#f97316',
    ringYaw: '#2563eb',
    ringPitch: '#14b8a6',
    ringRoll: '#f97316',
    lineYaw: '#2563eb',
    linePitch: '#14b8a6',
    lineRoll: '#f97316',
    warning: '#ea580c',
    locked: '#dc2626',
    neutral: '#94a3b8',
  })
  innerRollGroup.add(payload.group)

  middlePitchGroup.add(innerRollGroup)
  outerYawGroup.add(middlePitchGroup)
  root.add(new THREE.AxesHelper(3))
  root.add(outerYawGroup)
  stage.scene.add(root)

  function applyTheme(theme: SceneTheme, status: GimbalStatus) {
    stage.applyTheme(theme)

    const accent = status.isLocked ? theme.locked : status.isWarning ? theme.warning : theme.ringRoll
    outerRingMaterial.color.set(status.isWarning ? accent : theme.ringYaw)
    middleRingMaterial.color.set(theme.ringPitch)
    innerRingMaterial.color.set(status.isWarning ? accent : theme.ringRoll)

    payload.bodyMaterial.color.set(theme.payload)
    payload.accentMaterial.color.set(theme.payloadAccent)

    ;(yawLine.material as THREE.LineBasicMaterial).color.set(status.isWarning ? accent : theme.lineYaw)
    ;(pitchLine.material as THREE.LineBasicMaterial).color.set(theme.linePitch)
    ;(rollLine.material as THREE.LineBasicMaterial).color.set(status.isWarning ? accent : theme.lineRoll)
  }

  return {
    init() {
      stage.init()
    },
    update(angles, status, theme) {
      outerYawGroup.rotation.set(0, degreesToRadians(angles.yaw), 0)
      middlePitchGroup.rotation.set(degreesToRadians(angles.pitch), 0, 0)
      innerRollGroup.rotation.set(0, 0, degreesToRadians(angles.roll))
      applyTheme(theme, status)
    },
    handleResize() {
      stage.handleResize()
    },
    dispose() {
      disposeObject(root)
      stage.dispose()
    },
  }
}

export function createAxisDiagnosticScene(canvas: HTMLCanvasElement): SceneController {
  const stage = createBaseStage(
    canvas,
    new THREE.Vector3(4.4, 3.4, 4.8),
    new THREE.Vector3(0, 0.6, 0),
  )
  stage.controls.minDistance = 3
  stage.controls.maxDistance = 12

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.15 }),
  )
  stage.scene.add(origin)
  stage.scene.add(new THREE.AxesHelper(2.5))

  const yawArrowPositive = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2.5, 0x2563EB, 0.35, 0.18)
  const yawArrowNegative = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 0), 2.5, 0x2563EB, 0.35, 0.18)
  const rollArrowPositive = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2.5, 0xF97316, 0.35, 0.18)
  const rollArrowNegative = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 2.5, 0xF97316, 0.35, 0.18)

  stage.scene.add(yawArrowPositive)
  stage.scene.add(yawArrowNegative)
  stage.scene.add(rollArrowPositive)
  stage.scene.add(rollArrowNegative)

  const connectorGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ])
  const connectorMaterial = new THREE.LineDashedMaterial({
    color: 0x94A3B8,
    dashSize: 0.18,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.85,
  })
  const connector = new THREE.Line(connectorGeometry, connectorMaterial)
  connector.computeLineDistances()
  stage.scene.add(connector)

  const guideRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.02, 16, 80),
    new THREE.MeshBasicMaterial({
      color: 0x94A3B8,
      transparent: true,
      opacity: 0.35,
    }),
  )
  guideRing.rotation.x = Math.PI / 2
  stage.scene.add(guideRing)

  function applyTheme(theme: SceneTheme, status: GimbalStatus) {
    stage.applyTheme(theme)
    const accent = status.isLocked ? theme.locked : status.isWarning ? theme.warning : theme.lineRoll
    yawArrowPositive.setColor(color(theme.lineYaw))
    yawArrowNegative.setColor(color(theme.lineYaw))
    rollArrowPositive.setColor(color(accent))
    rollArrowNegative.setColor(color(accent))
    connectorMaterial.color.set(accent)
    ;(guideRing.material as THREE.MeshBasicMaterial).color.set(theme.neutral)
    ;(origin.material as THREE.MeshStandardMaterial).color.set(status.isLocked ? theme.locked : theme.payloadAccent)
  }

  return {
    init() {
      stage.init()
    },
    update(angles, status, theme) {
      const axisAlignment = computeAxisAlignment(angles)
      const yawVector = new THREE.Vector3(...axisAlignment.outerYawAxis)
      const rollVector = new THREE.Vector3(...axisAlignment.innerRollAxis)
      const arrowLength = 2.5

      yawArrowPositive.setDirection(yawVector)
      yawArrowPositive.setLength(arrowLength, 0.35, 0.18)
      yawArrowNegative.setDirection(yawVector.clone().multiplyScalar(-1))
      yawArrowNegative.setLength(arrowLength, 0.35, 0.18)
      rollArrowPositive.setDirection(rollVector)
      rollArrowPositive.setLength(arrowLength, 0.35, 0.18)
      rollArrowNegative.setDirection(rollVector.clone().multiplyScalar(-1))
      rollArrowNegative.setLength(arrowLength, 0.35, 0.18)

      const positions = connectorGeometry.attributes.position as THREE.BufferAttribute
      positions.setXYZ(0, yawVector.x * arrowLength, yawVector.y * arrowLength, yawVector.z * arrowLength)
      positions.setXYZ(1, rollVector.x * arrowLength, rollVector.y * arrowLength, rollVector.z * arrowLength)
      positions.needsUpdate = true
      connector.computeLineDistances()

      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        rollVector.clone().normalize(),
      )
      guideRing.quaternion.copy(quaternion)
      applyTheme(theme, status)
    },
    handleResize() {
      stage.handleResize()
    },
    dispose() {
      disposeObject(stage.scene)
      stage.dispose()
    },
  }
}
