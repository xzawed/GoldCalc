// xWidgets.ts — X(Twitter) widgets.js 동적 로더

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void
        createTimeline: (
          sourceType: string,
          sourceId: string,
          container: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement | null>
      }
    }
  }
}

const WIDGETS_SCRIPT_ID = 'x-widgets-js'
const WIDGETS_SCRIPT_URL = 'https://platform.twitter.com/widgets.js'

/**
 * X(Twitter) widgets.js 스크립트를 동적으로 로드합니다.
 * 이미 로드된 경우 즉시 resolve됩니다.
 */
export function loadXWidgets(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우 스킵
    if (document.getElementById(WIDGETS_SCRIPT_ID)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = WIDGETS_SCRIPT_ID
    script.src = WIDGETS_SCRIPT_URL
    script.async = true
    script.charset = 'utf-8'

    script.onload = () => resolve()
    script.onerror = () => reject(new Error('X widgets.js 로드 실패'))

    document.body.appendChild(script)
  })
}

/**
 * 특정 컨테이너(또는 전체 문서)의 X 위젯을 렌더링합니다.
 */
export function renderXWidgets(container?: HTMLElement): void {
  if (window.twttr?.widgets) {
    window.twttr.widgets.load(container)
  }
}
