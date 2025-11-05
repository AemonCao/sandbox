interface ImportMetaEnv {
  readonly VITE_ENV: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_EN_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
