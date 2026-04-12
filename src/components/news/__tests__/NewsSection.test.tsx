import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import NewsSection from '../NewsSection'

// widgets.js 로드를 모킹
vi.mock('@/utils/xWidgets', () => ({
  loadXWidgets: vi.fn().mockResolvedValue(undefined),
  renderXWidgets: vi.fn(),
}))

describe('NewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the news section', () => {
    renderWithProviders(<NewsSection />)
    expect(screen.getByTestId('news-section')).toBeInTheDocument()
  })

  it('renders the section title', () => {
    renderWithProviders(<NewsSection />)
    expect(screen.getByText('금융 소식')).toBeInTheDocument()
  })

  it('renders loading skeleton initially', () => {
    renderWithProviders(<NewsSection />)
    expect(screen.getByTestId('news-skeleton')).toBeInTheDocument()
  })

  it('renders the "X에서 더 보기" link', () => {
    renderWithProviders(<NewsSection />)
    const link = screen.getByText(/X에서 더 보기/)
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows error fallback when widgets fail to load', async () => {
    const { loadXWidgets } = await import('@/utils/xWidgets')
    vi.mocked(loadXWidgets).mockRejectedValueOnce(new Error('load failed'))

    renderWithProviders(<NewsSection />)

    await waitFor(() => {
      expect(screen.getByTestId('news-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/X\(Twitter\) 타임라인을 불러올 수 없습니다/)).toBeInTheDocument()
    expect(screen.getByText('X에서 직접 보기')).toBeInTheDocument()
  })

  it('has accessible section label', () => {
    renderWithProviders(<NewsSection />)
    const section = screen.getByTestId('news-section')
    expect(section).toHaveAttribute('aria-labelledby', 'news-title')
    expect(screen.getByText('금융 소식').closest('[id="news-title"]')).toBeInTheDocument()
  })
})
