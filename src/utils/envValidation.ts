/**
 * 환경변수 시작 시 검증
 * 필수 VITE_* 변수 미설정 시 console.warn으로 기능 저하 안내
 */
interface EnvCheck {
  key: string
  feature: string
}

// API 키는 모두 서버사이드 전용 (Railway 환경변수) — 클라이언트 번들에 포함 안 됨
// 클라이언트에서 검증 가능한 VITE_ 변수만 체크
const REQUIRED_ENV: EnvCheck[] = []

const OPTIONAL_ENV: EnvCheck[] = [
  { key: 'VITE_SUPABASE_URL', feature: '국내 금시세 페일오버 (Supabase)' },
]

export function validateEnv(): void {
  const missing = REQUIRED_ENV.filter(
    ({ key }) => !import.meta.env[key]
  )

  if (missing.length > 0) {
    console.warn(
      '[GoldCalc] 필수 환경변수 미설정. 다음 기능이 정상 작동하지 않을 수 있습니다:',
      missing.map(({ key, feature }) => `\n  - ${key}: ${feature}`).join('')
    )
  }

  const missingOptional = OPTIONAL_ENV.filter(
    ({ key }) => !import.meta.env[key]
  )

  if (missingOptional.length > 0) {
    // eslint-disable-next-line no-console
    console.info(
      '[GoldCalc] 선택 환경변수 미설정 (해당 기능 비활성):',
      missingOptional.map(({ key, feature }) => `\n  - ${key}: ${feature}`).join('')
    )
  }
}
