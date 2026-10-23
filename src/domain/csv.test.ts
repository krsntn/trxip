import { describe, expect, it } from 'vitest'
import { expensesToCsv } from './csv'
import { makeExpense as expense } from './testing'
import type { Category, Trip } from './types'

const japan: Trip = { homeCurrency: 'MYR', foreignCurrency: 'JPY', rate: 32.68 }
const categories: Category[] = [
  { id: 'transport', name: 'Transport', order: 0 },
  { id: 'food', name: 'Food', order: 1 },
]

describe('expensesToCsv', () => {
  it('writes one row per expense in spreadsheet order, with a blank foreign cell for home-currency expenses', () => {
    const expenses = [
      expense({ date: '2026-11-14', categoryId: 'transport', description: 'taxi to hall', amount: 1000, currency: 'foreign' }),
      expense({ date: '2026-11-15', categoryId: 'food', description: 'lunch, "ah ma" noodle house', amount: 50, currency: 'home' }),
      expense({ date: '2026-11-14', categoryId: 'food', description: 'ramen', amount: 1500, currency: 'foreign' }),
    ]

    expect(expensesToCsv(expenses, categories, japan)).toBe(
      [
        'Date,Category,Description,JPY,MYR',
        '2026-11-14,Transport,taxi to hall,1000,30.60',
        '2026-11-14,Food,ramen,1500,45.90',
        '2026-11-15,Food,"lunch, ""ah ma"" noodle house",,50.00',
      ].join('\r\n'),
    )
  })
})
