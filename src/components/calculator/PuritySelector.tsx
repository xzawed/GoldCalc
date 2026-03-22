import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PURITY_OPTIONS, PURITY_LABELS } from '@/utils/metalCalc'
import type { Purity, Metal } from '@/types/gold'

interface PuritySelectorProps {
  metal: Metal
  value: Purity
  onChange: (purity: Purity) => void
}

export function PuritySelector({ metal, value, onChange }: PuritySelectorProps) {
  const options = PURITY_OPTIONS[metal]

  return (
    <Select value={value} onValueChange={(v) => onChange(v as Purity)}>
      <SelectTrigger data-testid="purity-selector" aria-label="순도 선택">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((purity) => (
          <SelectItem key={purity} value={purity} data-testid={`purity-option-${purity}`}>
            {PURITY_LABELS[purity]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
