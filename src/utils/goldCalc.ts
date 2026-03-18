import type { WeightUnit, Purity } from '@/types/gold'

export const TROY_OZ_TO_G = 31.1035
export const DON_TO_G = 3.75
export const NYANG_TO_G = 37.5

export const PURITY_RATIO: Record<Purity, number> = {
  '24K': 0.9999,
  '18K': 0.75,
  '14K': 0.583,
}

export function calcPricePerGram(priceUSD: number, exchangeRate: number): number {
  return (priceUSD / TROY_OZ_TO_G) * exchangeRate
}

export function weightToGrams(weight: number, unit: WeightUnit): number {
  if (unit === 'g') return weight
  if (unit === 'don') return weight * DON_TO_G
  return weight * NYANG_TO_G
}

export function calcGoldPrice(
  weight: number,
  unit: WeightUnit,
  purity: Purity,
  priceUSD: number,
  exchangeRate: number
): number {
  const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
  const grams = weightToGrams(weight, unit)
  return Math.round(pricePerGram * grams * PURITY_RATIO[purity])
}
