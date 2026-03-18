// 무게 단위
export type WeightUnit = 'g' | 'don' | 'nyang'

// 순도
export type Purity = '24K' | '18K' | '14K'

// 기간 탭
export type Period = '1W' | '1M' | '3M' | '1Y'

// 예측 기간
export type ForecastDays = 7 | 30

// 현재 금시세 — 내부 정규화 구조 (API 응답 변환 후)
export interface GoldPriceResponse {
  priceUSD: number        // USD/troy oz
  priceKRW: number        // 원화/g (24K 기준, 계산됨)
  exchangeRate: number    // USD/KRW 환율
  changePercent?: number  // 전일 대비 등락률 (%)
  updatedAt?: string      // ISO 8601 갱신 시각
}

// 히스토리 항목
export interface HistoryEntry {
  date: string            // 'YYYY-MM-DD'
  priceUSD: number        // USD/troy oz
  priceKRW: number        // 원화/g (24K 기준)
  volume?: number         // 거래량 (선택)
}

// 예측 포인트
export interface ForecastPoint {
  date: string
  actual?: number         // 실제값 (과거 구간)
  predicted?: number      // 예측값 (미래 구간)
  upper?: number          // 신뢰 구간 상한 (+1σ)
  lower?: number          // 신뢰 구간 하한 (-1σ)
}

// 시장 신호
export interface MarketSignal {
  name: string            // 지표명 (DXY, 국채 10년물, VIX)
  value: number           // 현재값
  trend: 'up' | 'down' | 'neutral'
  description?: string    // 간략 설명
}

// 기간 요약 배지
export interface PeriodSummary {
  highest: HistoryEntry
  lowest: HistoryEntry
  averageKRW: number      // 원화/g 평균
}
