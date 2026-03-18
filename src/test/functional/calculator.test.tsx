import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import GoldCalculator from '@/components/calculator/GoldCalculator'

describe('GoldCalculator', () => {
  it('shows loading skeleton initially', () => {
    renderWithProviders(<GoldCalculator />)
    expect(screen.getByTestId('calculator-skeleton')).toBeInTheDocument()
  })

  it('shows calculator after data loads', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('gold-calculator')).toBeInTheDocument()
    })
  })

  it('renders weight input field', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('weight-input')).toBeInTheDocument()
    })
  })

  it('renders unit selector tabs', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('unit-tab-g')).toBeInTheDocument()
      expect(screen.getByTestId('unit-tab-don')).toBeInTheDocument()
      expect(screen.getByTestId('unit-tab-nyang')).toBeInTheDocument()
    })
  })

  it('renders purity selector', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('purity-selector')).toBeInTheDocument()
    })
  })

  it('shows price display after data loads', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('price-display')).toBeInTheDocument()
    })
  })

  it('shows dash when weight is 0', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      const totalPrice = screen.getByTestId('total-price')
      expect(totalPrice.textContent).toBe('—')
    })
  })

  it('shows calculated price when weight is entered', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('weight-input')).toBeInTheDocument()
    })
    const input = screen.getByTestId('weight-input')
    await user.type(input, '1')
    await waitFor(() => {
      const totalPrice = screen.getByTestId('total-price')
      expect(totalPrice.textContent).not.toBe('—')
      expect(totalPrice.textContent).toContain('₩')
    })
  })

  it('shows per-gram and per-don prices', async () => {
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('price-per-gram')).toBeInTheDocument()
      expect(screen.getByTestId('price-per-don')).toBeInTheDocument()
    })
  })

  it('changes unit when tab is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GoldCalculator />)
    await waitFor(() => {
      expect(screen.getByTestId('unit-tab-g')).toBeInTheDocument()
    })
    // Initially 'don' is active (default state)
    const donTab = screen.getByTestId('unit-tab-don')
    expect(donTab).toHaveAttribute('data-state', 'active')

    // Click gram tab
    const gramTab = screen.getByTestId('unit-tab-g')
    await user.click(gramTab)
    await waitFor(() => {
      expect(gramTab).toHaveAttribute('data-state', 'active')
    })
  })
})
