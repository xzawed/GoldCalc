/**
 * 영속 캐시 — API 한도 초과 시 마지막으로 수신한 데이터 반환
 * 만료 없음(날짜 무관). dailyCache와 달리 하루가 지나도 유지.
 */
const PREFIX = 'gc_pk_'

export interface PersistedEntry<T> {
  data: T
  savedAt: string // ISO 8601 datetime
}

export function getPersistentCache<T>(key: string): PersistedEntry<T> | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`)
    if (!raw) return null
    return JSON.parse(raw) as PersistedEntry<T>
  } catch {
    return null
  }
}

export function setPersistentCache<T>(key: string, value: T): void {
  try {
    const entry: PersistedEntry<T> = {
      data: value,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(entry))
  } catch {
    // Private browsing 등 storage 불가 환경에서는 무시
  }
}
