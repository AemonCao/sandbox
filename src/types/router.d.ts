import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    tags?: string[]
    isLayout?: boolean
    menu: {
      title?: string
      navSort?: number
      // Icon 的文件名称
      icon?: string
      // 是否显示大图标
      isBig?: boolean
    }
  }
}
