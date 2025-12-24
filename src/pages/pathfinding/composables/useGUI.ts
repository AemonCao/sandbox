import type { PathfindingParams } from './types'
import GUI from 'lil-gui'

export function useGUI(
  params: PathfindingParams,
  actions: {
    runAlgorithm: () => void
    pause: () => void
    reset: () => void
    clear: () => void
    randomWalls: () => void
    generateMaze: () => void
    skipToEnd: () => void
  },
  stats: { visitedCount: number, pathLength: number, duration: number },
  isDark: Ref<boolean>,
) {
  let gui: GUI | null = null

  /**
   * 初始化 GUI
   */
  function initGUI() {
    gui = new GUI({ title: '路径寻找可视化' })
    gui.domElement.style.position = 'fixed'
    gui.domElement.style.top = '85px'
    gui.domElement.style.right = '20px'

    // 算法选择
    const fAlgorithm = gui.addFolder('算法')
    fAlgorithm.add(params, 'algorithm', {
      'A*': 'astar',
      'Dijkstra': 'dijkstra',
      'BFS': 'bfs',
      'DFS': 'dfs',
    }).name('算法类型')
    fAlgorithm.add(params, 'allowDiagonal').name('允许对角线')
    fAlgorithm.open()

    // 控制按钮
    const fControl = gui.addFolder('控制')
    fControl.add(actions, 'runAlgorithm').name('▶ 运行')
    fControl.add(actions, 'pause').name('⏸ 暂停')
    fControl.add(actions, 'skipToEnd').name('⏭ 跳到结尾')
    fControl.add(actions, 'reset').name('🔄 重置')
    fControl.open()

    // 地图生成
    const fMap = gui.addFolder('地图')
    fMap.add(actions, 'clear').name('清空')
    fMap.add(actions, 'randomWalls').name('随机墙壁')
    fMap.add(actions, 'generateMaze').name('生成迷宫')
    fMap.add(params, 'wallDensity', 0, 0.5, 0.05).name('墙壁密度')
    fMap.open()

    // 显示设置
    const fDisplay = gui.addFolder('显示')
    fDisplay.add(params, 'gridSize', 10, 50, 5).name('网格大小')
    fDisplay.add(params, 'animationSpeed', 1, 120, 1).name('动画速度')
    fDisplay.open()

    // 统计信息
    const fStats = gui.addFolder('统计')
    fStats.add(stats, 'visitedCount').name('访问节点').disable().listen()
    fStats.add(stats, 'pathLength').name('路径长度').disable().listen()
    fStats.add(stats, 'duration').name('耗时(ms)').disable().listen()
    fStats.open()

    // 监听暗色模式
    watch(isDark, () => {
      if (gui)
        gui.domElement.classList.toggle('dark', isDark.value)
    }, { immediate: true })
  }

  /**
   * 销毁 GUI
   */
  function destroyGUI() {
    if (gui) {
      gui.destroy()
      gui = null
    }
  }

  return { initGUI, destroyGUI }
}
