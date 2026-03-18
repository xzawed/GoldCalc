import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import ForecastSection from '@/components/forecast/ForecastSection'

describe('ForecastSection', () => {
  it('renders the forecast section', () => {
    renderWithProviders(<ForecastSection />)
    expect(screen.getByTestId('forecast-section')).toBeInTheDocument()
  })

  it('renders section title', () => {
    renderWithProviders(<ForecastSection />)
    expect(screen.getByText('금시세 예측')).toBeInTheDocument()
  })

  it('always renders Disclaimer - even before data loads', () => {
    renderWithProviders(<ForecastSection />)
    // Disclaimer must ALWAYS be present, never conditional
    expect(screen.getByTestId('disclaimer')).toBeInTheDocument()
  })

  it('Disclaimer is still present after data loads', async () => {
    renderWithProviders(<ForecastSection />)
    await waitFor(() => {
      expect(screen.getByTestId('disclaimer')).toBeInTheDocument()
    })
  })

  it('renders forecast period tabs', () => {
    renderWithProviders(<ForecastSection />)
    expect(screen.getByTestId('forecast-tab-7')).toBeInTheDocument()
    expect(screen.getByTestId('forecast-tab-30')).toBeInTheDocument()
  })

  it('shows 7일 tab as default active', () => {
    renderWithProviders(<ForecastSection />)
    const tab7 = screen.getByTestId('forecast-tab-7')
    expect(tab7).toHaveAttribute('data-state', 'active')
  })

  it('switches to 30일 tab when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForecastSection />)
    const tab30 = screen.getByTestId('forecast-tab-30')
    await user.click(tab30)
    await waitFor(() => {
      expect(tab30).toHaveAttribute('data-state', 'active')
    })
  })

  it('switches back to 7일 tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForecastSection />)
    const tab30 = screen.getByTestId('forecast-tab-30')
    const tab7 = screen.getByTestId('forecast-tab-7')
    await user.click(tab30)
    await user.click(tab7)
    await waitFor(() => {
      expect(tab7).toHaveAttribute('data-state', 'active')
    })
  })

  it('Disclaimer contains required investment risk warning text', () => {
    renderWithProviders(<ForecastSection />)
    const disclaimer = screen.getByTestId('disclaimer')
    expect(disclaimer.textContent).toContain('투자 위험 고지')
    expect(disclaimer.textContent).toContain('투자 결정의 근거로 사용하지 마십시오')
  })
})
