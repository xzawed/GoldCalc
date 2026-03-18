import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { Purity } from '@/types/gold'

interface PuritySelectorProps {
  value: Purity
  onChange: (purity: Purity) => void
}

const PURITY_LABELS: Record<Purity, string> = {
  '24K': '24K (순금 99.99%)',
  '18K': '18K (75%)',
  '14K': '14K (58.3%)',
}

export function PuritySelector({ value, onChange }: PuritySelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Purity)}>
      <SelectTrigger data-testid="purity-selector" aria-label="순도 선택">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(PURITY_LABELS) as [Purity, string][]).map(([purity, label]) => (
          <SelectItem key={purity} value={purity} data-testid={`purity-option-${purity}`}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
