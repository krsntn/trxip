import { describe, expect, it } from 'vitest'
import { homeAmount } from './money'
import { makeExpense as expense } from './testing'
import type { Trip } from './types'

const japan: Trip = { homeCurrency: 'MYR', foreignCurrency: 'JPY', rate: 32.68 }

describe('homeAmount', () => {
  it('converts a foreign-currency expense at the rate and rounds to the home currency', () => {
    // 1,000 JPY ÷ 32.68 = 30.5997… MYR
    expect(homeAmount(expense({ amount: 1000, currency: 'foreign' }), japan)).toBe(30.6)
  })

  it('rounds to the decimals of the home currency', () => {
    const hawaii: Trip = { homeCurrency: 'JPY', foreignCurrency: 'USD', rate: 0.0066 }
    // 10 USD ÷ 0.0066 = 1,515.15… JPY, and JPY has no decimals
    expect(homeAmount(expense({ amount: 10, currency: 'foreign' }), hawaii)).toBe(1515)
  })

  it('keeps the typed amount of a home-currency expense', () => {
    expect(homeAmount(expense({ amount: 50, currency: 'home' }), japan)).toBe(50)
  })
})
