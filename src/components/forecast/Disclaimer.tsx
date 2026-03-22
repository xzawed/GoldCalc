import { Alert, AlertDescription } from '@/components/ui/alert'
import { METAL_LABELS } from '@/utils/metalCalc'
import type { Metal } from '@/types/gold'

interface DisclaimerProps {
  metal?: Metal
}

export function Disclaimer({ metal = 'gold' }: DisclaimerProps) {
  const metalName = METAL_LABELS[metal]

  return (
    <Alert variant="warning" data-testid="disclaimer" role="note" aria-label="투자 위험 고지">
      <AlertDescription className="text-xs leading-relaxed">
        <strong>⚠️ 투자 위험 고지:</strong> 본 예측은 이동평균(MA5/MA20) 및 선형 회귀 모델을 기반으로 하며,
        실제 {metalName}시세와 다를 수 있습니다. 본 정보는 참고 목적으로만 제공되며,
        투자 결정의 근거로 사용하지 마십시오. {metalName} 투자에는 원금 손실 위험이 있습니다.
      </AlertDescription>
    </Alert>
  )
}
