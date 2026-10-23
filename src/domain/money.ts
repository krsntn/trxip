import type { CurrencyCode, Expense, Trip } from './types'

/** Standard number of decimals for a currency (JPY 0, MYR 2, KWD 3). */
export function currencyDecimals(currency: CurrencyCode): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits ?? 2
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function homeAmount(expense: Expense, trip: Trip): number {
  if (expense.currency === 'home') return expense.amount
  return roundTo(expense.amount / trip.rate, currencyDecimals(trip.homeCurrency))
}
