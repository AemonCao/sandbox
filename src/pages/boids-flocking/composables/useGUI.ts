import type { Ref } from 'vue'
import type { SimulationParams } from './types'
import GUI from 'lil-gui'

export function useGUI(
  params: SimulationParams,
  resetSimulation: () => void,
  isDark: Ref<boolean>,
) {
  let gui: GUI | null = null

  function initGUI() {
    gui = new GUI()
    gui.domElement.style.position = 'fixed'
    gui.domElement.style.top = '70px'
    gui.domElement.style.right = '10px'

    const fSim = gui.addFolder('模拟设置')
    fSim.add(params, 'boidCount', 10, 500, 1).name('Boid 数量').onFinishChange(resetSimulation)
    fSim.add(params, 'predatorCount', 0, 10, 1).name('天敌数量').onFinishChange(resetSimulation)
    fSim.add(params, 'boundaryBehavior', ['wrap', 'bounce']).name('边界行为')

    const fRules = gui.addFolder('规则权重')
    fRules.add(params, 'lightSeeking').name('启用追光')
    fRules.add(params, 'seekForce', 0, 5, 0.1).name('追光力')
    fRules.add(params, 'separation', 0, 5, 0.1).name('分离')
    fRules.add(params, 'alignment', 0, 5, 0.1).name('对齐')
    fRules.add(params, 'cohesion', 0, 5, 0.1).name('聚集')
    fRules.add(params, 'fleeForce', 0, 10, 0.1).name('逃跑力')

    const bounceFolder = fRules.addFolder('反弹模式参数')
    bounceFolder.add(params, 'wallAvoidDistance', 5, 100, 1).name('墙壁预判距离')
    bounceFolder.add(params, 'wallAvoidForce', 0, 10, 0.1).name('墙壁规避力')

    const fApp = gui.addFolder('外观设置')
    fApp.addColor(params, 'boidColor').name('Boid 颜色')
    fApp.addColor(params, 'predatorColor').name('天敌颜色')
    fApp.add(params, 'predatorSize', 4, 20, 1).name('天敌大小')

    const fParams = gui.addFolder('行为参数')
    fParams.add(params, 'minSpeed', 0.1, 5, 0.1).name('最小速度')
    fParams.add(params, 'maxSpeed', 1, 10, 0.1).name('最大速度')
    fParams.add(params, 'separationRadius', 5, 100, 1).name('分离半径')
    fParams.add(params, 'perceptionRadius', 5, 150, 1).name('感知半径')
    fParams.add(params, 'predatorPerceptionRadius', 10, 200, 1).name('天敌感知半径')

    // 监听暗色模式变化
    watch(isDark, () => {
      if (gui) {
        gui.domElement.classList.toggle('dark', isDark.value)
      }
    })
  }

  function destroyGUI() {
    if (gui) {
      gui.destroy()
      gui = null
    }
  }

  return {
    initGUI,
    destroyGUI,
  }
}
