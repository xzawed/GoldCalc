import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Sprint 04 에서 구현 예정
export default function ForecastSection() {
  return (
    <section aria-labelledby="forecast-title" data-testid="forecast-section">
      <Card>
        <CardHeader>
          <CardTitle id="forecast-title">금시세 예측</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">예측 차트는 Sprint 04에서 구현됩니다.</p>
          <Alert variant="warning">
            <AlertDescription>
              본 예측은 이동평균(MA5/MA20) 및 선형 회귀 모델을 기반으로 하며, 실제 시세와 다를 수 있습니다.
              투자 결정의 근거로 사용하지 마십시오.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </section>
  )
}
