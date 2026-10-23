import { currencyDecimals, homeAmount } from './money'
import type { Category, Expense, Trip } from './types'

function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** CSV in spreadsheet order: oldest date first, then save order. */
export function expensesToCsv(expenses: Expense[], categories: Category[], trip: Trip): string {
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const foreignDecimals = currencyDecimals(trip.foreignCurrency)
  const homeDecimals = currencyDecimals(trip.homeCurrency)

  const rows = [...expenses]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((e) =>
      [
        e.date,
        cell(names.get(e.categoryId) ?? ''),
        cell(e.description),
        e.currency === 'foreign' ? e.amount.toFixed(foreignDecimals) : '',
        homeAmount(e, trip).toFixed(homeDecimals),
      ].join(','),
    )

  return [`Date,Category,Description,${trip.foreignCurrency},${trip.homeCurrency}`, ...rows].join('\r\n')
}
