import { homeAmount } from '@/domain/money'
import { groupByDay } from '@/domain/totals'
import type { Category, Expense, Trip } from '@/domain/types'
import { formatAmount, formatDay } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Phone: description, then the foreign and home amount columns, like the spreadsheet. */
const phoneColumns = 'grid grid-cols-[minmax(0,1fr)_5.25rem_5.25rem] gap-x-2'
/** Web layout: the category gets its own column. */
const wideColumns = 'grid grid-cols-[8rem_minmax(0,1fr)_6rem_6rem] gap-x-4 px-3'

/** The height of the web layout's top bar, so the column header stays below it. */
const belowTopBar = 'top-[calc(3.5rem+env(safe-area-inset-top))]'

export function ExpensesScreen({
  trip,
  expenses,
  categories,
  onEdit,
  wide = false,
}: {
  trip: Trip
  expenses: Expense[]
  categories: Category[]
  onEdit: (expense: Expense) => void
  wide?: boolean
}) {
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const days = groupByDay(expenses, trip)
  const columns = wide ? wideColumns : phoneColumns

  return (
    <>
      {wide ? (
        <header className={cn('sticky z-10 bg-background/95 backdrop-blur', belowTopBar)}>
          <h1 className="sr-only">Expenses</h1>
          {days.length > 0 && (
            <div className={`${columns} border-b border-border py-2 text-sm text-muted-foreground`} aria-hidden>
              <span>Category</span>
              <span>Description</span>
              <span className="figures text-right text-foreign/80">{trip.foreignCurrency}</span>
              <span className="figures text-right">{trip.homeCurrency}</span>
            </div>
          )}
        </header>
      ) : (
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
      )}

      {days.length === 0 ? (
        <div className={wide ? 'px-3 pt-4' : 'px-4 pt-10'}>
          <p className="font-heading text-xl font-semibold">No expenses yet</p>
          <p className="mt-1 text-muted-foreground">
            {wide
              ? 'Use Add expense in the top bar to add the first thing you pay for.'
              : 'Tap + to add the first thing you pay for.'}
          </p>
        </div>
      ) : (
        <div className={wide ? '' : 'px-4'}>
          {days.map((day) => (
            <section
              key={day.date}
              aria-label={formatDay(day.date)}
              className={wide ? 'mt-6 first:mt-3' : 'mt-8 first:mt-4'}
            >
              {/* A full-width band marks where each date starts. */}
              <div
                className={cn(
                  columns,
                  'items-baseline border-y border-border bg-card py-2.5',
                  !wide && '-mx-4 px-4',
                )}
              >
                <DayLabel date={day.date} className={wide ? 'col-span-2' : undefined} />
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
                        className={`${columns} w-full items-center border-b border-border py-2.5 text-left outline-none hover:bg-muted/60 focus-visible:bg-muted active:bg-muted`}
                      >
                        {wide ? (
                          <>
                            <span className="truncate text-muted-foreground">{category}</span>
                            {/* A wide screen has room for a second line, so a long description wraps and is never cut. */}
                            <span className="break-words">{e.description}</span>
                          </>
                        ) : (
                          <span className="min-w-0">
                            <span className="block truncate">{e.description || category}</span>
                            {e.description && (
                              <span className="block truncate text-sm text-muted-foreground">{category}</span>
                            )}
                          </span>
                        )}
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
function DayLabel({ date, className }: { date: string; className?: string }) {
  const [weekday, ...rest] = formatDay(date).split(' ')
  return (
    <h2 className={cn('font-heading text-[17px] font-semibold', className)}>
      <span className="text-muted-foreground">{weekday}</span> {rest.join(' ')}
    </h2>
  )
}
