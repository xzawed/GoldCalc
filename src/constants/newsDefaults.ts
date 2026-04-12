// newsDefaults.ts — X(Twitter) 금융 소식 섹션 기본 설정

/**
 * X 임베드 타임라인 설정
 *
 * X 리스트 URL 설정 방법:
 * 1. X에서 리스트를 생성하거나 기존 리스트 URL을 복사
 * 2. 예: https://twitter.com/i/lists/1234567890
 * 3. 아래 DEFAULT_X_LIST_URL을 해당 URL로 교체
 *
 * 계정 타임라인으로 대체하려면:
 * DEFAULT_X_EMBED_URL = 'https://twitter.com/계정명'
 */

/** 임베드할 X 리스트 또는 계정 URL */
export const DEFAULT_X_EMBED_URL = 'https://twitter.com/i/lists/2043297405916090454' // 금융 소식 리스트 (공개 설정 필요)

/** 금융 소식 관련 추천 X 계정 목록 (리스트 생성 시 참고용) — 인증 계정, MAGA 관련 위주 */
export const RECOMMENDED_X_ACCOUNTS = [
  // MAGA / 트럼프 행정부 — 경제·무역·관세 정책 (인증)
  { handle: 'realDonaldTrump', name: 'Donald J. Trump', note: '미국 대통령, 경제·관세·달러 정책 발언' },
  { handle: 'JDVance', name: 'JD Vance', note: '미국 부통령, 제조업·무역 정책' },
  { handle: 'elonmusk', name: 'Elon Musk', note: 'DOGE 수장, 재정 효율화·달러 영향' },
  // 금·귀금속 — MAGA/사운드머니 성향 (인증)
  { handle: 'WallStreetSilv', name: 'Wall Street Silver', note: '금/은 투자 커뮤니티, MAGA 성향' },
  { handle: 'GoldTelegraph_', name: 'Gold Telegraph', note: '금 시세·중앙은행 금 매입 분석' },
  { handle: 'PetterSchiff', name: 'Peter Schiff', note: '금 옹호론자, 달러·인플레이션 비평' },
  { handle: 'theRealKiyosaki', name: 'Robert Kiyosaki', note: '부자 아빠, 금·은 강세론, 트럼프 지지' },
  // 거시경제·시장 (인증)
  { handle: 'unusual_whales', name: 'Unusual Whales', note: '시장 이상 거래·의원 매매 추적' },
]

/** X 타임라인 위젯 렌더링 옵션 */
export const X_WIDGET_OPTIONS = {
  height: 600,
  theme: 'dark' as const,
  chrome: 'noheader nofooter noborders transparent',
  lang: 'ko',
  tweetLimit: 10,
}
