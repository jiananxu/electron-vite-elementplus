/// <reference types="vite/client" />

// 声明 Vue 组件类型
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 Window 接口，添加 Electron API
interface Window {
  api?: {
    openExternalUrl: (url: string) => void
    // 添加其他可能的 API 方法
    [key: string]: any
  }
}
