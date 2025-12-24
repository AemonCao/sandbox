/**
 * 字体配置和管理
 */

export interface FontOption {
  value: string
  label: string
  googleFont?: string
}

/**
 * 可用字体列表
 */
export const FONT_OPTIONS: FontOption[] = [
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'Monaco, monospace', label: 'Monaco' },
  { value: 'SF Mono, monospace', label: 'SF Mono' },
  { value: 'Menlo, monospace', label: 'Menlo' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono', googleFont: 'JetBrains Mono' },
  { value: 'Fira Code, monospace', label: 'Fira Code', googleFont: 'Fira Code' },
  { value: 'Source Code Pro, monospace', label: 'Source Code Pro', googleFont: 'Source Code Pro' },
  { value: 'Roboto Mono, monospace', label: 'Roboto Mono', googleFont: 'Roboto Mono' },
  { value: 'IBM Plex Mono, monospace', label: 'IBM Plex Mono', googleFont: 'IBM Plex Mono' },
]

/**
 * 预加载 Google Fonts
 */
export function preloadGoogleFonts() {
  const fontsToLoad = FONT_OPTIONS
    .filter(font => font.googleFont)
    .map(font => font.googleFont!)

  if (fontsToLoad.length === 0)
    return

  // 创建 link 标签加载字体
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(font => `family=${font.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`
  document.head.appendChild(link)
}

/**
 * 检测字体是否可用
 */
export async function checkFontAvailability(fontFamily: string): Promise<boolean> {
  try {
    const font = fontFamily.split(',')[0].trim().replace(/['"]/g, '')
    await document.fonts.load(`12px "${font}"`)
    return document.fonts.check(`12px "${font}"`)
  }
  catch {
    return false
  }
}

/**
 * 检测所有字体的可用性
 */
export async function checkAllFonts(): Promise<Set<string>> {
  const availableFonts = new Set<string>()

  for (const font of FONT_OPTIONS) {
    const isAvailable = await checkFontAvailability(font.value)
    if (isAvailable) {
      availableFonts.add(font.value)
    }
  }

  return availableFonts
}
