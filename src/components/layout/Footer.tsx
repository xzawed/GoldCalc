export function Footer() {
  const links = [
    { label: '금시세', href: 'https://www.goldapi.io', name: 'GoldAPI.io' },
    { label: '은시세', href: 'https://gold-api.com', name: 'gold-api.com' },
    { label: '환율', href: 'https://www.exchangerate-api.com', name: 'ExchangeRate-API' },
    { label: '국내금', href: 'https://www.data.go.kr', name: '공공데이터포털' },
  ]

  return (
    <footer className="border-t border-border/50 py-5 mt-4">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-xs text-muted-foreground mb-2">
          {links.map((link, i) => (
            <span key={link.href} className="flex items-center gap-1">
              {i > 0 && <span className="text-border">·</span>}
              <span>{link.label}:</span>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/80 hover:text-foreground underline underline-offset-2 transition-colors"
              >
                {link.name}
              </a>
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/60">
          본 사이트의 정보는 참고용이며 투자 결정의 근거로 사용하지 마십시오.
        </p>
      </div>
    </footer>
  )
}
