/**
 * localStorage 기반 일별 캐시 유틸리티
 * API 무료 한도 보호: 같은 날에는 API 재호출 없이 캐시 반환
 */
const PREFIX = 'gc_'

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function getDailyCache<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(`${PREFIX}${key}:${getTodayKey()}`)
    if (!stored) return null
    return JSON.parse(stored) as T
  } catch (error) {
    console.warn('[dailyCache] 읽기 실패 (손상된 데이터 가능성):', error)
    return null
  }
}

export function setDailyCache<T>(key: string, value: T): void {
  try {
    const todayKey = getTodayKey()
    const fullKey = `${PREFIX}${key}:${todayKey}`
    localStorage.setItem(fullKey, JSON.stringify(value))
    // 이전 날짜 캐시 정리
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(`${PREFIX}${key}:`) && !k.endsWith(todayKey)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // Private browsing 등 storage 불가 환경에서는 무시
  }
}
