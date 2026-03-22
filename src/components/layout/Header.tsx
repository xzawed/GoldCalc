export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">GoldCalc</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">귀금속 시세 계산기</span>
        </div>
        <span className="text-xs text-muted-foreground">실시간 환율 기준</span>
      </div>
    </header>
  )
}
