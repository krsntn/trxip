import { homeAmount } from '@/domain/money'
import { groupByDay } from '@/domain/totals'
import type { Category, Expense, Trip } from '@/domain/types'
import { formatAmount, formatDay } from '@/lib/format'

/** Description, then the foreign and home amount columns, like the spreadsheet. */
const columns = 'grid grid-cols-[minmax(0,1fr)_5.25rem_5.25rem] gap-x-2'

export function ExpensesScreen({
  trip,
  expenses,
  categories,
  onEdit,
}: {
  trip: Trip
  expenses: Expense[]
  categories: Category[]
  onEdit: (expense: Expense) => void
}) {
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const days = groupByDay(expenses, trip)

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/95 px-4 pt-[max(env(safe-area-inset-top),1.25rem)] backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h1 className="font-heading text-2xl font-semibold">Expenses</h1>
          <a
            href="#/config"
            className="figures rounded text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            1 {trip.homeCurrency} = <span className="text-foreign">{trip.rate} {trip.foreignCurrency}</span>
          </a>
        </div>
        {days.length > 0 && (
          <div className={`${columns} figures mt-3 border-b border-border py-2 text-sm text-muted-foreground`} aria-hidden>
            <span />
            <span className="text-right text-foreign/80">{trip.foreignCurrency}</span>
            <span className="text-right">{trip.homeCurrency}</span>
          </div>
        )}
      </header>

      {days.length === 0 ? (
        <div className="px-4 pt-10">
          <p className="font-heading text-xl font-semibold">No expenses yet</p>
          <p className="mt-1 text-muted-foreground">Tap + to add the first thing you pay for.</p>
        </div>
      ) : (
        <div className="px-4">
          {days.map((day) => (
            <section key={day.date} aria-label={formatDay(day.date)} className="mt-8 first:mt-4">
              {/* A full-width band marks where each date starts. */}
              <div className={`${columns} -mx-4 items-baseline border-y border-border bg-card px-4 py-2.5`}>
                <DayLabel date={day.date} />
                <span />
                <span className="figures text-right text-[17px] font-semibold">
                  {formatAmount(day.total, trip.homeCurrency)}
                </span>
              </div>
              <ul className="[&>li:last-child>button]:border-b-0">
                {day.expenses.map((e) => {
                  const category = names.get(e.categoryId) ?? ''
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onEdit(e)}
                        className={`${columns} w-full items-center border-b border-border py-2.5 text-left outline-none focus-visible:bg-muted active:bg-muted`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{e.description || category}</span>
                          {e.description && (
                            <span className="block truncate text-sm text-muted-foreground">{category}</span>
                          )}
                        </span>
                        <span className="figures text-right text-[17px] text-foreign">
                          {e.currency === 'foreign' ? formatAmount(e.amount, trip.foreignCurrency) : ''}
                        </span>
                        <span className="figures text-right text-[17px]">
                          {formatAmount(homeAmount(e, trip), trip.homeCurrency)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

/** "Fri 23 Oct", with the weekday muted so the date stands out. */
function DayLabel({ date }: { date: string }) {
  const [weekday, ...rest] = formatDay(date).split(' ')
  return (
    <h2 className="font-heading text-[17px] font-semibold">
      <span className="text-muted-foreground">{weekday}</span> {rest.join(' ')}
    </h2>
  )
}
