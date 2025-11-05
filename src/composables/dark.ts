export const isDark = useDark()

// @ts-expect-error: Transition API
const isAppearanceTransition = document.startViewTransition // 是否支持视图过渡
  && !window.matchMedia(`(prefers-reduced-motion: reduce)`).matches // 是否开启了减少动画

export function toggleDark(event: MouseEvent) {
  if (!isAppearanceTransition) {
    isDark.value = !isDark.value
  }
  else {
    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )
    const transition = document.startViewTransition(() => {
      isDark.value = !isDark.value
    })
    transition.ready.then(() => {
      const clipPath = [
        `circle(${endRadius}px at ${x}px ${y}px)`,
        `circle(0px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: isDark.value ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 600,
          easing: 'ease-in-out',
          pseudoElement: isDark.value ? '::view-transition-old(root)' : '::view-transition-new(root)',
        },
      )
    })
  }
}
