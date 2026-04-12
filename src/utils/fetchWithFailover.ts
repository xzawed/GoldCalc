// fetchWithFailover.ts — 국내 금시세 API 페일오버 유틸
// Railway(/api/domestic-gold) 우선 호출 → 장애 시 Supabase Edge Function 자동 전환
// Circuit breaker 패턴: Railway 실패 후 1분간 Supabase 우선, 이후 Railway 재시도

/** Railway 프록시 경로 (상대 URL) */
const PRIMARY_URL = '/api/domestic-gold'

/** Supabase Edge Function URL — 호출 시점에 평가 (테스트에서 env 변경 가능) */
function getFallbackUrl(): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL
  return base ? `${base}/functions/v1/domestic-gold` : null
}

/** 요청 타임아웃 (ms) — Railway가 정상이면 1-2초, 장애 시 빠른 감지를 위해 5초 */
const REQUEST_TIMEOUT_MS = 5_000

/** Circuit breaker 오픈 지속 시간 (ms) — Railway 실패 후 1분간 Supabase 우선 */
const CIRCUIT_OPEN_DURATION_MS = 60_000

/** Circuit breaker: 이 시각 이전에는 Railway를 건너뜀 (모듈 레벨 싱글턴) */
let circuitOpenUntil = 0

export type ApiSource = 'railway' | 'supabase'

export interface FailoverFetchResult<T> {
  data: T
  source: ApiSource
}

/**
 * 타임아웃이 적용된 fetch (Promise.race 기반)
 */
async function timedFetch(url: string): Promise<Response> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`요청 타임아웃 (${REQUEST_TIMEOUT_MS}ms)`)), REQUEST_TIMEOUT_MS)
  )
  const res = await Promise.race([fetch(url), timeout])
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res
}

/**
 * Railway 우선, 장애 시 Supabase Edge Function으로 자동 페일오버.
 *
 * - Circuit breaker가 열려있으면 Supabase를 먼저 시도
 * - Railway 성공 시 circuit breaker 리셋
 * - VITE_SUPABASE_URL 미설정 시 페일오버 없이 Railway만 사용
 *
 * @param queryString `?numOfRows=1&resultType=json` 형태의 쿼리스트링
 */
export async function fetchDomesticGold<T>(queryString: string): Promise<FailoverFetchResult<T>> {
  const now = Date.now()
  const isCircuitOpen = now < circuitOpenUntil
  const fallbackUrl = getFallbackUrl()

  // Circuit breaker 오픈 중 → Supabase 우선
  if (isCircuitOpen && fallbackUrl) {
    try {
      const res = await timedFetch(`${fallbackUrl}${queryString}`)
      const data = (await res.json()) as T
      return { data, source: 'supabase' }
    } catch (supabaseError) {
      console.warn('[fetchWithFailover] Supabase 페일오버도 실패, Railway 최종 시도:', supabaseError)
      // Supabase도 실패 → Railway 마지막 시도
      const res = await timedFetch(`${PRIMARY_URL}${queryString}`)
      const data = (await res.json()) as T
      circuitOpenUntil = 0 // Railway 복구 확인됨
      return { data, source: 'railway' }
    }
  }

  // Circuit breaker 오픈 중 + Supabase 없음 → Railway 직접 시도 (복구 확인)
  if (isCircuitOpen) {
    const res = await timedFetch(`${PRIMARY_URL}${queryString}`)
    const data = (await res.json()) as T
    circuitOpenUntil = 0 // Railway 복구 확인됨
    return { data, source: 'railway' }
  }

  // 정상 상태 → Railway 우선
  try {
    const res = await timedFetch(`${PRIMARY_URL}${queryString}`)
    const data = (await res.json()) as T
    return { data, source: 'railway' }
  } catch (railwayError) {
    // Railway 실패 → circuit breaker 활성화
    circuitOpenUntil = now + CIRCUIT_OPEN_DURATION_MS

    if (!fallbackUrl) {
      throw railwayError
    }

    // Supabase 페일오버
    try {
      const res = await timedFetch(`${fallbackUrl}${queryString}`)
      const data = (await res.json()) as T
      return { data, source: 'supabase' }
    } catch (supabaseError) {
      console.warn('[fetchWithFailover] Supabase 페일오버 실패:', supabaseError)
      throw railwayError // 원래 에러를 상위에 전파
    }
  }
}

/**
 * 현재 circuit breaker 상태 반환 (디버깅/UI 표시용)
 */
export function isFailoverActive(): boolean {
  return Date.now() < circuitOpenUntil
}

/**
 * Circuit breaker 수동 리셋 (테스트용)
 */
export function resetCircuitBreaker(): void {
  circuitOpenUntil = 0
}
