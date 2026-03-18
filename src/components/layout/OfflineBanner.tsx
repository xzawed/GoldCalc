import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="alert"
      className="bg-destructive text-destructive-foreground text-sm text-center py-2 px-4 flex items-center justify-center gap-2"
    >
      <WifiOff className="h-4 w-4" />
      <span>오프라인 상태입니다. 데이터가 최신이 아닐 수 있습니다.</span>
    </div>
  )
}
