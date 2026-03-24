import { cn } from '@/lib/utils'
import { ASSET_TABS } from '@/types/gold'
import type { AssetTab } from '@/types/gold'

interface AssetNavProps {
  activeTab: AssetTab
  onChange: (tab: AssetTab) => void
  /** 탭 가용성: null=로딩중(표시), true=가용(표시), false=불가(숨김) */
  availability: Record<AssetTab, boolean | null>
}

export function AssetNav({ activeTab, onChange, availability }: AssetNavProps) {
  // false인 탭만 숨김 (null=로딩 중은 표시 유지)
  const visibleTabs = ASSET_TABS.filter((tab) => availability[tab.key] !== false)

  return (
    <div className="border-b border-border/50 bg-background/60 backdrop-blur-sm" data-testid="asset-nav">
      <div className="container mx-auto max-w-5xl px-4 py-3">
        <div
          role="tablist"
          aria-label="자산 선택"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/40"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.key
            const isGold = tab.metal === 'gold'
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.key as AssetTab)}
                data-testid={`asset-tab-${tab.key}`}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? isGold
                      ? 'bg-amber-500/15 text-amber-400 shadow-sm border border-amber-500/20'
                      : 'bg-slate-500/15 text-slate-300 shadow-sm border border-slate-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
