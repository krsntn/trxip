import { categorySummary, tripTotal } from '@/domain/totals'
import type { Category, Expense, Trip } from '@/domain/types'
import { formatAmount, formatDayRange } from '@/lib/format'

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
  const dates = expenses.map((e) => e.date).sort()

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="font-heading text-2xl font-semibold">Summary</h1>
      {dates.length > 0 && (
        <p className="mt-0.5 text-muted-foreground">
          {dates.length} {dates.length === 1 ? 'expense' : 'expenses'}, {formatDayRange(dates[0], dates.at(-1)!)}
        </p>
      )}

      {/* Accounting convention: a double line closes the trip total. */}
      <div className="rule-double mt-7 pb-4">
        <p className="text-muted-foreground">Trip total</p>
        <p className="mt-1 font-figure text-5xl leading-none font-semibold lining-nums">
          {formatAmount(tripTotal(expenses, trip), trip.homeCurrency)}
          <span className="ml-2 text-xl font-medium text-muted-foreground">{trip.homeCurrency}</span>
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="pt-6 text-muted-foreground">Add expenses to see where your money goes.</p>
      ) : (
        <ul className="mt-7 flex flex-col gap-5">
          {rows.map(({ category, total, share }) => (
            <li key={category.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate">{category.name}</span>
                <span className="figures shrink-0 text-[17px]">
                  {formatAmount(total, trip.homeCurrency)}
                  <span className="ml-2 inline-block w-11 text-right text-muted-foreground">
                    {percent.format(share)}
                  </span>
                </span>
              </div>
              {/* The bar grows from a square start; only its end is rounded. The track is a dark step of the same colour. */}
              <div className="mt-2 h-2 rounded-r-[4px] bg-brand/15" aria-hidden>
                <div className="h-full rounded-r-[4px] bg-brand" style={{ width: `${share * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
