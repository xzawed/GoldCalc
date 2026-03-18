import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface ErrorAlertProps {
  message?: string
}

export function ErrorAlert({ message = '데이터를 불러오는 중 오류가 발생했습니다.' }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" data-testid="error-alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
