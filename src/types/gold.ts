// 무게 단위
export type WeightUnit = 'g' | 'don' | 'nyang'

// 순도
export type Purity = '24K' | '18K' | '14K'

// 기간 탭
export type Period = '1W' | '1M' | '3M' | '1Y'

// 예측 기간
export type ForecastDays = 7 | 30

// 현재 금시세 API 응답 (GoldAPI.io)
export interface GoldPriceResponse {
  price: number           // USD/troy oz
  price_gram_24k: number
  price_gram_18k: number
  price_gram_14k: number
  timestamp: number       // Unix timestamp
  currency: string
}

// 히스토리 항목
export interface HistoryEntry {
  date: string            // 'YYYY-MM-DD'
  priceUSD: number        // USD/troy oz
  exchangeRate: number    // USD/KRW
  priceKRWperGram: number // 원화/g (24K 기준)
  changeRate: number      // 전일 대비 등락률 (%)
}

// 예측 포인트
export interface ForecastPoint {
  date: string
  actual?: number         // 실제값 (과거 구간)
  predicted?: number      // 예측값 (미래 구간)
  upper?: number          // 신뢰 구간 상한
  lower?: number          // 신뢰 구간 하한
}

// 시장 신호
export interface MarketSignal {
  name: string            // 지표명
  value: number           // 현재값
  trend: 'up' | 'down' | 'neutral'
  description?: string    // 간략 설명
}

// 기간 요약
export interface PeriodSummary {
  highest: HistoryEntry
  lowest: HistoryEntry
  average: number         // USD/oz 평균
}
