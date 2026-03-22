import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import HistorySection from '@/components/history/HistorySection'

describe('HistorySection', () => {
  it('renders the history section', () => {
    renderWithProviders(<HistorySection />)
    expect(screen.getByTestId('history-section')).toBeInTheDocument()
  })

  it('renders all period tabs', () => {
    renderWithProviders(<HistorySection />)
    expect(screen.getByTestId('period-tab-1W')).toBeInTheDocument()
    expect(screen.getByTestId('period-tab-1M')).toBeInTheDocument()
    expect(screen.getByTestId('period-tab-3M')).toBeInTheDocument()
    expect(screen.getByTestId('period-tab-1Y')).toBeInTheDocument()
  })

  it('shows 1주 tab as default active', () => {
    renderWithProviders(<HistorySection />)
    const tab1W = screen.getByTestId('period-tab-1W')
    expect(tab1W).toHaveAttribute('data-state', 'active')
  })

  it('switches to 1M tab when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HistorySection />)
    const tab1M = screen.getByTestId('period-tab-1M')
    await user.click(tab1M)
    await waitFor(() => {
      expect(tab1M).toHaveAttribute('data-state', 'active')
    })
  })

  it('switches to 3M tab when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HistorySection />)
    const tab3M = screen.getByTestId('period-tab-3M')
    await user.click(tab3M)
    await waitFor(() => {
      expect(tab3M).toHaveAttribute('data-state', 'active')
    })
  })

  it('switches to 1Y tab when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HistorySection />)
    const tab1Y = screen.getByTestId('period-tab-1Y')
    await user.click(tab1Y)
    await waitFor(() => {
      expect(tab1Y).toHaveAttribute('data-state', 'active')
    })
  })

  it('renders section title', () => {
    renderWithProviders(<HistorySection />)
    expect(screen.getByText('금 날짜별 시세 변동')).toBeInTheDocument()
  })
})
