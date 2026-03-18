/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 금시세 API (GoldAPI.io)
  readonly VITE_GOLD_API_KEY: string
  readonly VITE_GOLD_API_URL: string
  // 환율 API (ExchangeRate-API v6)
  readonly VITE_EXCHANGE_RATE_API_KEY: string
  readonly VITE_EXCHANGE_RATE_API_URL: string
  // 보조 지표 (선택)
  readonly VITE_ALPHA_VANTAGE_KEY: string
  readonly VITE_FRED_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
