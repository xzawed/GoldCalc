import { describe, it, expect } from 'vitest'
import {
  calcPricePerGram,
  weightToGrams,
  calcGoldPrice,
  TROY_OZ_TO_G,
  DON_TO_G,
  NYANG_TO_G,
  PURITY_RATIO,
} from './goldCalc'

describe('calcPricePerGram', () => {
  it('calculates price per gram correctly with known values', () => {
    // (2650.5 / 31.1035) * 1380 ≈ 117,576
    const result = calcPricePerGram(2650.5, 1380)
    expect(result).toBeCloseTo((2650.5 / TROY_OZ_TO_G) * 1380, 2)
  })

  it('returns 0 when priceUSD is 0', () => {
    expect(calcPricePerGram(0, 1380)).toBe(0)
  })

  it('returns 0 when exchangeRate is 0', () => {
    expect(calcPricePerGram(2650.5, 0)).toBe(0)
  })

  it('calculates correctly with high exchange rate', () => {
    const result = calcPricePerGram(1000, 1500)
    expect(result).toBeCloseTo((1000 / TROY_OZ_TO_G) * 1500, 2)
  })
})

describe('weightToGrams', () => {
  it('returns same weight for grams unit', () => {
    expect(weightToGrams(10, 'g')).toBe(10)
  })

  it('converts don to grams correctly', () => {
    expect(weightToGrams(1, 'don')).toBe(DON_TO_G) // 3.75g
    expect(weightToGrams(2, 'don')).toBe(7.5)
    expect(weightToGrams(10, 'don')).toBe(37.5)
  })

  it('converts nyang to grams correctly', () => {
    expect(weightToGrams(1, 'nyang')).toBe(NYANG_TO_G) // 37.5g
    expect(weightToGrams(2, 'nyang')).toBe(75)
  })

  it('handles zero weight for all units', () => {
    expect(weightToGrams(0, 'g')).toBe(0)
    expect(weightToGrams(0, 'don')).toBe(0)
    expect(weightToGrams(0, 'nyang')).toBe(0)
  })

  it('handles fractional weights', () => {
    expect(weightToGrams(0.5, 'don')).toBe(1.875)
    expect(weightToGrams(0.5, 'nyang')).toBe(18.75)
  })
})

describe('calcGoldPrice', () => {
  const priceUSD = 2650.5
  const exchangeRate = 1380

  it('calculates 24K gold price correctly', () => {
    const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
    const expected = Math.round(pricePerGram * 3.75 * PURITY_RATIO['24K'])
    expect(calcGoldPrice(1, 'don', '24K', priceUSD, exchangeRate)).toBe(expected)
  })

  it('calculates 18K gold price correctly', () => {
    const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
    const expected = Math.round(pricePerGram * 3.75 * PURITY_RATIO['18K'])
    expect(calcGoldPrice(1, 'don', '18K', priceUSD, exchangeRate)).toBe(expected)
  })

  it('calculates 14K gold price correctly', () => {
    const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
    const expected = Math.round(pricePerGram * 3.75 * PURITY_RATIO['14K'])
    expect(calcGoldPrice(1, 'don', '14K', priceUSD, exchangeRate)).toBe(expected)
  })

  it('calculates price in grams unit', () => {
    const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
    const expected = Math.round(pricePerGram * 10 * PURITY_RATIO['24K'])
    expect(calcGoldPrice(10, 'g', '24K', priceUSD, exchangeRate)).toBe(expected)
  })

  it('calculates price in nyang unit', () => {
    const pricePerGram = calcPricePerGram(priceUSD, exchangeRate)
    const expected = Math.round(pricePerGram * NYANG_TO_G * PURITY_RATIO['24K'])
    expect(calcGoldPrice(1, 'nyang', '24K', priceUSD, exchangeRate)).toBe(expected)
  })

  it('returns 0 for zero weight', () => {
    expect(calcGoldPrice(0, 'g', '24K', priceUSD, exchangeRate)).toBe(0)
    expect(calcGoldPrice(0, 'don', '24K', priceUSD, exchangeRate)).toBe(0)
    expect(calcGoldPrice(0, 'nyang', '24K', priceUSD, exchangeRate)).toBe(0)
  })

  it('handles very small amounts', () => {
    const result = calcGoldPrice(0.01, 'g', '24K', priceUSD, exchangeRate)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(typeof result).toBe('number')
  })

  it('18K price is 75% of 24K price (approximately)', () => {
    const price24K = calcGoldPrice(1, 'don', '24K', priceUSD, exchangeRate)
    const price18K = calcGoldPrice(1, 'don', '18K', priceUSD, exchangeRate)
    // 18K / 24K ≈ 0.75 / 0.9999 ≈ 0.75007
    const ratio = price18K / price24K
    expect(ratio).toBeCloseTo(0.75 / 0.9999, 2)
  })

  it('returns integer (Math.round applied)', () => {
    const result = calcGoldPrice(1, 'don', '24K', priceUSD, exchangeRate)
    expect(result).toBe(Math.round(result))
  })
})
