import type { GlobalThemeOverrides } from 'naive-ui'

/* ┌──WARNING────────────────────────────────────────────────────────────────
   │  主题配置
   │  请在添加自定义颜色变量时，同时在src\naive-ui.d.ts中添加对应的类型声明
   └───────────────────────────────────────────────────────────────────────── */

export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
  },
  DataTable: {
    thColor: '#004B97',
    thTextColor: '#FFFFFF',
    tdColorStriped: '#08365D',
    tdColor: '#04233D',
    tdTextColor: '#FFFFFF',
    tdColorHover: '#0A4A78',
  },
}

export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
  },
}
