// 자산 종류
export type Metal = 'gold' | 'silver'

// 시세 소스
export type PriceSource = 'international' | 'domestic'

// 자산 탭 (UI 네비게이션용)
export type AssetTab = 'intl-gold' | 'intl-silver' | 'domestic-gold' | 'domestic-silver'

// 무게 단위
export type WeightUnit = 'g' | 'don' | 'nyang'

// 금 순도
export type GoldPurity = '24K' | '18K' | '14K'

// 은 순도
export type SilverPurity = '999' | '925' | '900' | '800'

// 통합 순도 (기존 호환 + 은 확장)
export type Purity = GoldPurity | SilverPurity

// 기간 탭
export type Period = '1W' | '1M' | '3M' | '1Y'

// 기간 탭 UI 옵션 (중복 방지용 공통 상수)
export const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: '1W', label: '1주' },
  { key: '1M', label: '1개월' },
  { key: '3M', label: '3개월' },
  { key: '1Y', label: '1년' },
]

// 예측 기간
export type ForecastDays = 7 | 30

// 현재 시세 — 국제 금/은 공통
export interface MetalPriceResponse {
  metal: Metal
  priceUSD: number        // USD/troy oz
  priceKRW: number        // 원화/g (최고순도 기준, 계산됨)
  exchangeRate: number    // USD/KRW 환율
  changePercent?: number  // 전일 대비 등락률 (%)
  updatedAt?: string      // ISO 8601 갱신 시각
}

// 기존 호환 별칭
export type GoldPriceResponse = MetalPriceResponse

// 국내 금시세 응답 (data.go.kr KRX 금시장)
export interface DomesticGoldPriceResponse {
  priceKRW: number        // 원화/g (KRX 금시장 기준)
  changePercent?: number  // 전일 대비 등락률 (%)
  volume?: number         // 거래량
  updatedAt?: string      // 기준 일시
}

// 히스토리 항목
export interface HistoryEntry {
  date: string            // 'YYYY-MM-DD'
  priceUSD: number        // USD/troy oz
  priceKRW: number        // 원화/g (최고순도 기준)
  volume?: number         // 거래량 (선택)
}

// 국내금 히스토리 항목
export interface DomesticHistoryEntry {
  date: string            // 'YYYY-MM-DD'
  priceKRW: number        // 원화/g (KRX 기준)
  volume?: number         // 거래량
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

// 자산 탭 설정
export interface AssetTabConfig {
  key: AssetTab
  label: string
  metal: Metal
  source: PriceSource
}

// data.go.kr 국내 금시세 API 응답 (useDomesticGoldPrice, useDomesticGoldHistory 공용)
export interface DataGoKrItem {
  basDt: string
  itmsNm: string
  clpr: string
  mkp: string
  hipr: string
  lopr: string
  vs: string
  fltRt: string
  trqu: string
  trPrc: string
}

export interface DataGoKrResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: {
      totalCount: number
      pageNo: number
      numOfRows: number
      items: { item: DataGoKrItem[] }
    }
  }
}

export const ASSET_TABS: AssetTabConfig[] = [
  { key: 'intl-gold', label: '국제 금', metal: 'gold', source: 'international' },
  { key: 'intl-silver', label: '국제 은', metal: 'silver', source: 'international' },
  { key: 'domestic-gold', label: '국내 금', metal: 'gold', source: 'domestic' },
  { key: 'domestic-silver', label: '국내 은', metal: 'silver', source: 'domestic' },
]
