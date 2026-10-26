import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/domain/types'
import type { Screen } from '@/hooks/useScreen'
import { cn } from '@/lib/utils'

/** In the web layout, Summary sits beside Expenses, so both screens make the Expenses link current. */
const links = [
  { href: '#/', label: 'Expenses', current: (screen: Screen) => screen !== 'config' },
  { href: '#/config', label: 'Config', current: (screen: Screen) => screen === 'config' },
]

/** The navigation of the web layout. It replaces the bottom bar at 1024px and wider. */
export function TopBar({ screen, trip, onAdd }: { screen: Screen; trip: Trip; onAdd: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-8 px-6">
        <span className="font-heading text-lg font-semibold">Trxip</span>
        <nav aria-label="Screens" className="flex h-full gap-6">
          {links.map((link) => {
            const current = link.current(screen)
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'relative flex items-center rounded-sm text-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                  current
                    ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
        <a
          href="#/config"
          className="figures ml-auto rounded text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          1 {trip.homeCurrency} = <span className="text-foreign">{trip.rate} {trip.foreignCurrency}</span>
        </a>
        <Button onClick={onAdd} className="h-9 gap-2 px-3.5 text-[15px]">
          <Plus className="size-4" strokeWidth={2.25} />
          Add expense
          {/* Only a device with a mouse or a trackpad is likely to have a keyboard. */}
          <kbd className="ml-0.5 hidden rounded border border-background/25 px-1.5 text-xs leading-5 text-background/70 pointer-fine:inline-block">
            N
          </kbd>
        </Button>
      </div>
    </header>
  )
}
