export function formatKRW(value: number): string {
  return '₩' + value.toLocaleString('ko-KR')
}

export function formatUSD(value: number): string {
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatChangeRate(rate: number): string {
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}

// 등락 색상 — 한국 증시 관례: 상승=빨강, 하락=파랑
export function getChangeColor(rate: number): string {
  if (rate > 0) return 'text-red-500'
  if (rate < 0) return 'text-blue-500'
  return 'text-muted-foreground'
}

// 등락 아이콘 — 접근성: 색상만으로 구분 금지, 아이콘 병행
export function getChangeIcon(rate: number): string {
  if (rate > 0) return '▲'
  if (rate < 0) return '▼'
  return '─'
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}
