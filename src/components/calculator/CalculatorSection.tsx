import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Sprint 02 에서 구현 예정
export default function CalculatorSection() {
  return (
    <section aria-labelledby="calculator-title" data-testid="calculator-section">
      <Card>
        <CardHeader>
          <CardTitle id="calculator-title">금 시세 계산기</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">계산기 기능은 Sprint 02에서 구현됩니다.</p>
        </CardContent>
      </Card>
    </section>
  )
}
