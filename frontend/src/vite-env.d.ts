/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AI_SERVICE_URL: string
  readonly VITE_UPLOAD_MAX_SIZE: string
  readonly VITE_SUPPORTED_FORMATS: string
  readonly VITE_DEBUG: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot?: {
    accept(): void
    accept(cb: () => void): void
    accept(dep: string, cb: () => void): void
    accept(deps: string[], cb: () => void): void
    dispose(cb: () => void): void
    decline(): void
    invalidate(): void
  }
}