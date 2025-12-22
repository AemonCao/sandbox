import type { DisplayMode } from './types'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Three.js场景管理
 */
export function useThreeScene(canvas: HTMLCanvasElement) {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let terrain: THREE.Mesh | null = null
  let wireframe: THREE.LineSegments | null = null
  let animationId: number

  /**
   * 初始化场景
   */
  function initScene() {
    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // 天空蓝

    // 创建相机
    const aspect = canvas.clientWidth / canvas.clientHeight
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.position.set(0, 50, 100)
    camera.lookAt(0, 0, 0)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // 创建OrbitControls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 20
    controls.maxDistance = 300
    controls.maxPolarAngle = Math.PI / 2 - 0.1 // 限制不能看到地形下方

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // 启动动画循环
    animate()
  }

  /**
   * 动画循环
   */
  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  /**
   * 更新地形
   * @param mesh - 地形网格
   * @param displayMode - 显示模式
   */
  function updateTerrain(mesh: THREE.Mesh, displayMode: DisplayMode) {
    // 移除旧地形
    if (terrain) {
      scene.remove(terrain)
      terrain.geometry.dispose()
      if (Array.isArray(terrain.material)) {
        terrain.material.forEach(m => m.dispose())
      }
      else {
        terrain.material.dispose()
      }
    }

    // 移除旧线框
    if (wireframe) {
      scene.remove(wireframe)
      wireframe.geometry.dispose()
      if (Array.isArray(wireframe.material)) {
        wireframe.material.forEach(m => m.dispose())
      }
      else {
        wireframe.material.dispose()
      }
      wireframe = null
    }

    // 添加新地形
    terrain = mesh

    // 根据显示模式设置
    if (displayMode === 'solid') {
      terrain.material.wireframe = false
      scene.add(terrain)
    }
    else if (displayMode === 'wireframe') {
      // 创建线框
      const wireframeGeometry = new THREE.WireframeGeometry(terrain.geometry)
      const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 })
      wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial)
      wireframe.rotation.copy(terrain.rotation)
      scene.add(wireframe)
    }
    else if (displayMode === 'both') {
      terrain.material.wireframe = false
      scene.add(terrain)

      // 添加线框
      const wireframeGeometry = new THREE.WireframeGeometry(terrain.geometry)
      const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true })
      wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial)
      wireframe.rotation.copy(terrain.rotation)
      scene.add(wireframe)
    }
  }

  /**
   * 处理窗口大小变化
   */
  function handleResize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  /**
   * 清理资源
   */
  function dispose() {
    cancelAnimationFrame(animationId)

    if (terrain) {
      terrain.geometry.dispose()
      if (Array.isArray(terrain.material)) {
        terrain.material.forEach(m => m.dispose())
      }
      else {
        terrain.material.dispose()
      }
    }

    if (wireframe) {
      wireframe.geometry.dispose()
      if (Array.isArray(wireframe.material)) {
        wireframe.material.forEach(m => m.dispose())
      }
      else {
        wireframe.material.dispose()
      }
    }

    controls.dispose()
    renderer.dispose()
  }

  return {
    initScene,
    updateTerrain,
    handleResize,
    dispose,
  }
}
