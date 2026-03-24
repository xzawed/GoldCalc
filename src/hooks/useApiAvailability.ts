import { useGoldPrice } from './useGoldPrice'
import { useSilverPrice } from './useSilverPrice'
import { useExchangeRate } from './useExchangeRate'
import { useDomesticGoldPrice } from './useDomesticGoldPrice'
import type { AssetTab } from '@/types/gold'

/**
 * 각 자산 탭의 데이터 가용성을 반환
 * - null  : 아직 로딩 중 (탭 숨기지 않음)
 * - true  : 데이터 있음 (fresh 또는 stale) → 탭 노출
 * - false : 데이터 없음 (API 오류 + 캐시 없음) → 탭 숨김
 */
export function useApiAvailability(): Record<AssetTab, boolean | null> {
  const { data: goldData, isError: goldError, isLoading: goldLoading } = useGoldPrice()
  const { data: silverData, isError: silverError, isLoading: silverLoading } = useSilverPrice()
  const { data: rateData, isError: rateError, isLoading: rateLoading } = useExchangeRate()
  const { data: domesticData, isError: domesticError, isLoading: domesticLoading } = useDomesticGoldPrice()

  // 아직 로딩 중이면 null (탭 그대로 유지)
  const goldOk = goldLoading ? null : !goldError && goldData !== undefined
  const silverOk = silverLoading ? null : !silverError && silverData !== undefined
  const rateOk = rateLoading ? null : !rateError && rateData !== undefined
  const domesticOk = domesticLoading ? null : !domesticError && domesticData !== undefined

  const intlOk = (goldOk === null || rateOk === null)
    ? null
    : goldOk && rateOk

  const silverIntlOk = (silverOk === null || rateOk === null)
    ? null
    : silverOk && rateOk

  return {
    'intl-gold': intlOk,
    'intl-silver': silverIntlOk,
    'domestic-gold': domesticOk,
    'domestic-silver': silverIntlOk, // 국내은도 XAG + 환율 의존
  }
}
