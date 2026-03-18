import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Sprint 03 에서 구현 예정
export default function HistorySection() {
  return (
    <section aria-labelledby="history-title" data-testid="history-section">
      <Card>
        <CardHeader>
          <CardTitle id="history-title">금시세 변동 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">변동 내역 차트는 Sprint 03에서 구현됩니다.</p>
        </CardContent>
      </Card>
    </section>
  )
}
