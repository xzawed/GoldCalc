import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ASSET_TABS } from '@/types/gold'
import type { AssetTab } from '@/types/gold'

interface AssetNavProps {
  activeTab: AssetTab
  onChange: (tab: AssetTab) => void
}

export function AssetNav({ activeTab, onChange }: AssetNavProps) {
  return (
    <div className="border-b bg-background" data-testid="asset-nav">
      <div className="container mx-auto max-w-5xl px-4 py-2">
        <Tabs value={activeTab} onValueChange={(v) => onChange(v as AssetTab)}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl" aria-label="자산 선택">
            {ASSET_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} data-testid={`asset-tab-${tab.key}`}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
