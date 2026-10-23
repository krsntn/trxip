import { describe, expect, it } from 'vitest'
import { makeExpense as expense } from './testing'
import { categorySummary, groupByDay, tripTotal } from './totals'
import type { Category, Trip } from './types'

const japan: Trip = { homeCurrency: 'MYR', foreignCurrency: 'JPY', rate: 32.68 }

describe('groupByDay', () => {
  it('puts the newest day first, the newest saved expense first, and totals each day', () => {
    const taxi = expense({ date: '2026-11-14', amount: 1000, currency: 'foreign' }) // 30.60
    const lunch = expense({ date: '2026-11-14', amount: 50, currency: 'home' }) // 50.00
    const museum = expense({ date: '2026-11-15', amount: 2000, currency: 'foreign' }) // 61.20
    const coffee = expense({ date: '2026-11-14', amount: 500, currency: 'foreign' }) // 15.30, saved a day late

    expect(groupByDay([taxi, lunch, museum, coffee], japan)).toEqual([
      { date: '2026-11-15', total: 61.2, expenses: [museum] },
      { date: '2026-11-14', total: 95.9, expenses: [coffee, lunch, taxi] },
    ])
  })
})

describe('categorySummary', () => {
  it('lists used categories by highest home total, with each share of the trip total', () => {
    const transport: Category = { id: 'transport', name: 'Transport', order: 0 }
    const food: Category = { id: 'food', name: 'Food', order: 1 }
    const shopping: Category = { id: 'shopping', name: 'Shopping', order: 2 }
    const tickets: Category = { id: 'tickets', name: 'Tickets', order: 3 }
    const expenses = [
      expense({ categoryId: 'food', amount: 50, currency: 'home' }), // 50.00
      expense({ categoryId: 'food', amount: 1000, currency: 'foreign' }), // 30.60
      expense({ categoryId: 'transport', amount: 500, currency: 'foreign' }), // 15.30
      expense({ categoryId: 'tickets', amount: 2000, currency: 'foreign' }), // 61.20
    ]

    // Trip total 157.10. Shopping has no expenses, so it is hidden.
    expect(categorySummary(expenses, [transport, food, shopping, tickets], japan)).toEqual([
      { category: food, total: 80.6, share: expect.closeTo(0.513, 3) },
      { category: tickets, total: 61.2, share: expect.closeTo(0.39, 3) },
      { category: transport, total: 15.3, share: expect.closeTo(0.0974, 3) },
    ])
  })
})

describe('tripTotal', () => {
  it('adds the rounded home amounts, so the total matches the rows you see', () => {
    // The spreadsheet example: rows show 61.20 and 190.32 MYR.
    // Unrounded they add to 251.5146…, which a spreadsheet shows as 251.51.
    const trip: Trip = { homeCurrency: 'MYR', foreignCurrency: 'JPY', rate: 1.6341 }
    const expenses = [
      expense({ amount: 100, currency: 'foreign' }),
      expense({ amount: 311, currency: 'foreign' }),
    ]
    expect(tripTotal(expenses, trip)).toBe(251.52)
  })
})
