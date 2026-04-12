/**
 * 환경변수 시작 시 검증
 * 필수 VITE_* 변수 미설정 시 console.warn으로 기능 저하 안내
 */
interface EnvCheck {
  key: string
  feature: string
}

const REQUIRED_ENV: EnvCheck[] = [
  { key: 'VITE_GOLD_API_KEY', feature: '국제 금시세 (GoldAPI.io)' },
  { key: 'VITE_GOLD_API_URL', feature: '국제 금시세 URL (GoldAPI.io)' },
  { key: 'VITE_EXCHANGE_RATE_API_KEY', feature: '환율 (ExchangeRate-API)' },
  { key: 'VITE_EXCHANGE_RATE_API_URL', feature: '환율 URL (ExchangeRate-API)' },
]

const OPTIONAL_ENV: EnvCheck[] = [
  { key: 'VITE_SUPABASE_URL', feature: '국내 금시세 페일오버 (Supabase)' },
  { key: 'VITE_FRED_API_KEY', feature: '미국 국채 10년 시그널 (FRED)' },
  { key: 'VITE_ALPHA_VANTAGE_KEY', feature: 'VIX 공포지수 시그널 (Alpha Vantage)' },
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
    console.info(
      '[GoldCalc] 선택 환경변수 미설정 (해당 기능 비활성):',
      missingOptional.map(({ key, feature }) => `\n  - ${key}: ${feature}`).join('')
    )
  }
}
