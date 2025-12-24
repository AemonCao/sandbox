import type { AnimationFrame, PathfindingParams } from './types'

export function useAnimation(params: PathfindingParams) {
  let frames: AnimationFrame[] = []
  let currentFrame = 0
  let animationId: number | null = null
  let lastTime = 0

  const stats = reactive({
    visitedCount: 0,
    pathLength: 0,
    duration: 0,
  })

  /**
   * 加载动画帧序列
   */
  function loadFrames(newFrames: AnimationFrame[]) {
    frames = newFrames
    currentFrame = 0
    stats.visitedCount = frames.filter(f => f.type === 'visit').length
    stats.pathLength = frames.filter(f => f.type === 'path').length
  }

  /**
   * 播放动画
   */
  function play(onFrame: (frame: AnimationFrame) => void, onComplete: () => void) {
    if (currentFrame >= frames.length) {
      onComplete()
      return
    }

    params.isPlaying = true
    lastTime = performance.now()

    function animate(time: number) {
      if (!params.isPlaying)
        return

      const delta = time - lastTime
      const interval = 1000 / params.animationSpeed

      if (delta >= interval) {
        lastTime = time - (delta % interval)

        if (currentFrame < frames.length) {
          onFrame(frames[currentFrame])
          currentFrame++
        }
        else {
          params.isPlaying = false
          onComplete()
          return
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
  }

  /**
   * 暂停动画
   */
  function pause() {
    params.isPlaying = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  /**
   * 重置动画
   */
  function reset() {
    pause()
    currentFrame = 0
    stats.visitedCount = 0
    stats.pathLength = 0
    stats.duration = 0
  }

  /**
   * 跳到最后（直接显示结果）
   */
  function skipToEnd(onFrame: (frame: AnimationFrame) => void) {
    pause()
    while (currentFrame < frames.length) {
      onFrame(frames[currentFrame])
      currentFrame++
    }
  }

  return {
    stats,
    loadFrames,
    play,
    pause,
    reset,
    skipToEnd,
  }
}
