import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { server } from '@/test/mocks/server'
import NewsSection from '../NewsSection'

describe('NewsSection', () => {
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

  it('renders the "구글 뉴스에서 더 보기" link', () => {
    renderWithProviders(<NewsSection />)
    const link = screen.getByText(/구글 뉴스에서 더 보기/)
    expect(link).toBeInTheDocument()
    const anchor = link.closest('a')
    expect(anchor).toHaveAttribute('target', '_blank')
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders news items after successful fetch', async () => {
    renderWithProviders(<NewsSection />)

    await waitFor(() => {
      expect(screen.getByTestId('news-list')).toBeInTheDocument()
    })

    expect(screen.getByText('금 가격 사상 최고치 경신 — 온스당 $3,200 돌파')).toBeInTheDocument()
    expect(screen.getByText('연합뉴스')).toBeInTheDocument()
    expect(screen.getByText('달러 약세에 금값 상승세 지속')).toBeInTheDocument()
  })

  it('each news item has accessible external link', async () => {
    renderWithProviders(<NewsSection />)

    await waitFor(() => {
      expect(screen.getByText('금 가격 사상 최고치 경신 — 온스당 $3,200 돌파')).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /금 가격 사상 최고치 경신/ })
    expect(link).toHaveAttribute('href', 'https://example.com/news/1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows error fallback when API returns error', async () => {
    server.use(
      http.get('*/api/news', () => HttpResponse.error()),
    )

    renderWithProviders(<NewsSection />)

    await waitFor(() => {
      expect(screen.getByTestId('news-error')).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText(/뉴스를 불러올 수 없습니다/)).toBeInTheDocument()
    expect(screen.getByText('구글 뉴스에서 직접 보기')).toBeInTheDocument()
  })

  it('has accessible section label', () => {
    renderWithProviders(<NewsSection />)
    const section = screen.getByTestId('news-section')
    expect(section).toHaveAttribute('aria-labelledby', 'news-title')
    expect(screen.getByText('금융 소식').closest('[id="news-title"]')).toBeInTheDocument()
  })
})
