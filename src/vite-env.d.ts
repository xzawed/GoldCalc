/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOLD_API_KEY: string
  readonly VITE_EXCHANGE_API_KEY: string
  readonly VITE_ALPHA_VANTAGE_KEY: string
  readonly VITE_FRED_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
