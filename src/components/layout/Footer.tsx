export function Footer() {
  return (
    <footer className="border-t py-4 text-center text-xs text-muted-foreground">
      <p>
        금시세:{' '}
        <a
          href="https://www.goldapi.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          GoldAPI.io
        </a>{' '}
        · 은시세:{' '}
        <a
          href="https://gold-api.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          gold-api.com
        </a>{' '}
        · 환율:{' '}
        <a
          href="https://www.exchangerate-api.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          ExchangeRate-API
        </a>{' '}
        · 국내금:{' '}
        <a
          href="https://www.data.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          공공데이터포털
        </a>
      </p>
      <p className="mt-1">본 사이트의 정보는 참고용이며 투자 결정의 근거로 사용하지 마십시오.</p>
    </footer>
  )
}
