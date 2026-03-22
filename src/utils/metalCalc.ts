import type { WeightUnit, Metal, GoldPurity, SilverPurity, Purity } from '@/types/gold'

export const TROY_OZ_TO_G = 31.1035
export const DON_TO_G = 3.75
export const NYANG_TO_G = 37.5

// 금 순도 비율
export const GOLD_PURITY_RATIO: Record<GoldPurity, number> = {
  '24K': 0.9999,
  '18K': 0.75,
  '14K': 0.583,
}

// 은 순도 비율
export const SILVER_PURITY_RATIO: Record<SilverPurity, number> = {
  '999': 0.999,
  '925': 0.925,
  '900': 0.9,
  '800': 0.8,
}

// 통합 순도 비율
export const PURITY_RATIO: Record<Purity, number> = {
  ...GOLD_PURITY_RATIO,
  ...SILVER_PURITY_RATIO,
}

// 자산별 기본 순도
export const DEFAULT_PURITY: Record<Metal, Purity> = {
  gold: '24K',
  silver: '999',
}

// 자산별 순도 옵션 목록
export const PURITY_OPTIONS: Record<Metal, Purity[]> = {
  gold: ['24K', '18K', '14K'],
  silver: ['999', '925', '900', '800'],
}

// 순도 라벨
export const PURITY_LABELS: Record<Purity, string> = {
  '24K': '24K (순금 99.99%)',
  '18K': '18K (75%)',
  '14K': '14K (58.3%)',
  '999': '999 (순은 99.9%)',
  '925': '925 (스털링 실버)',
  '900': '900 (90%)',
  '800': '800 (80%)',
}

// 자산 라벨
export const METAL_LABELS: Record<Metal, string> = {
  gold: '금',
  silver: '은',
}

export function calcPricePerGram(priceUSD: number, exchangeRate: number): number {
  return (priceUSD / TROY_OZ_TO_G) * exchangeRate
}

export function weightToGrams(weight: number, unit: WeightUnit): number {
  if (unit === 'g') return weight
  if (unit === 'don') return weight * DON_TO_G
  return weight * NYANG_TO_G
}

export function calcMetalPrice(
  weight: number,
  unit: WeightUnit,
  purity: Purity,
  priceUSD: number,
  exchangeRate: number,
): number {
  const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
  const grams = weightToGrams(weight, unit)
  return Math.round(pricePerGram * grams * PURITY_RATIO[purity])
}

// 기존 호환 별칭
export const calcGoldPrice = calcMetalPrice
