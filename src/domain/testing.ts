import type { Expense } from './types'

let nextId = 1

/** Builds an expense for tests. Each call gets a new id and a later createdAt. */
export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  const n = nextId++
  return {
    id: `e${n}`,
    date: '2026-11-14',
    categoryId: 'transport',
    description: '',
    amount: 1,
    currency: 'foreign',
    createdAt: n,
    ...overrides,
  }
}
