import { categorySummary, tripTotal } from '@/domain/totals'
import type { Category, Expense, Trip } from '@/domain/types'
import { formatAmount } from '@/lib/format'

const percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 })

export function SummaryScreen({
  trip,
  expenses,
  categories,
}: {
  trip: Trip
  expenses: Expense[]
  categories: Category[]
}) {
  const rows = categorySummary(expenses, categories, trip)

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="font-heading text-2xl font-semibold">Summary</h1>
      <p className="rule-double mt-4 flex items-baseline justify-between pb-3">
        <span className="text-muted-foreground">Trip total</span>
        <span className="figures text-2xl font-medium">
          {formatAmount(tripTotal(expenses, trip), trip.homeCurrency)}{' '}
          <span className="text-base text-muted-foreground">{trip.homeCurrency}</span>
        </span>
      </p>

      {rows.length === 0 ? (
        <p className="pt-6 text-muted-foreground">Add expenses to see where your money goes.</p>
      ) : (
        <ul>
          {rows.map(({ category, total, share }) => (
            <li key={category.id} className="border-b border-border py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate">{category.name}</span>
                <span className="figures shrink-0 text-[17px]">
                  {formatAmount(total, trip.homeCurrency)}
                  <span className="ml-2 inline-block w-10 text-right text-muted-foreground">
                    {percent.format(share)}
                  </span>
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-foreground/70" style={{ width: `${share * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
