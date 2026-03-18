import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WeightUnit } from '@/types/gold'

interface UnitSelectorProps {
  value: WeightUnit
  onChange: (unit: WeightUnit) => void
}

const UNIT_LABELS: Record<WeightUnit, string> = { g: 'g (그램)', don: '돈', nyang: '냥' }

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as WeightUnit)}>
      <TabsList className="grid grid-cols-3 w-full" aria-label="무게 단위 선택">
        {(Object.entries(UNIT_LABELS) as [WeightUnit, string][]).map(([unit, label]) => (
          <TabsTrigger key={unit} value={unit} data-testid={`unit-tab-${unit}`}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
