import { currencyDecimals, homeAmount, roundTo } from './money'
import type { Category, Expense, Trip } from './types'

/** Sum of the rounded home amounts. Rounding again removes floating-point noise from the addition. */
function sumHome(expenses: Expense[], trip: Trip): number {
  const sum = expenses.reduce((total, e) => total + homeAmount(e, trip), 0)
  return roundTo(sum, currencyDecimals(trip.homeCurrency))
}

export interface Day {
  date: string
  total: number
  expenses: Expense[]
}

/** Newest day first; within a day, the newest saved expense first. */
export function groupByDay(expenses: Expense[], trip: Trip): Day[] {
  const byDate = new Map<string, Expense[]>()
  for (const e of expenses) {
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayExpenses]) => ({
      date,
      total: sumHome(dayExpenses, trip),
      expenses: dayExpenses.sort((a, b) => b.createdAt - a.createdAt),
    }))
}

export function tripTotal(expenses: Expense[], trip: Trip): number {
  return sumHome(expenses, trip)
}

export interface CategoryTotal {
  category: Category
  total: number
  /** Fraction of the trip total, from 0 to 1. */
  share: number
}

/** Categories with expenses, highest home total first. */
export function categorySummary(
  expenses: Expense[],
  categories: Category[],
  trip: Trip,
): CategoryTotal[] {
  const all = tripTotal(expenses, trip)
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const total = sumHome(
        expenses.filter((e) => e.categoryId === category.id),
        trip,
      )
      return { category, total, share: all === 0 ? 0 : total / all }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
}
