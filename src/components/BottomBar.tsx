import { ChartNoAxesColumn, Plus, ReceiptText, SlidersHorizontal } from 'lucide-react'
import type { Screen } from '@/hooks/useScreen'
import { cn } from '@/lib/utils'

const tabs = [
  { screen: 'expenses', label: 'Expenses', icon: ReceiptText },
  { screen: 'summary', label: 'Summary', icon: ChartNoAxesColumn },
  { screen: 'config', label: 'Config', icon: SlidersHorizontal },
] as const

export function BottomBar({ screen, onAdd }: { screen: Screen; onAdd: () => void }) {
  return (
    <nav
      aria-label="Screens"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center pr-4 pl-2">
        {tabs.map(({ screen: target, label, icon: Icon }) => (
          <a
            key={target}
            href={`#/${target === 'expenses' ? '' : target}`}
            aria-current={screen === target ? 'page' : undefined}
            className={cn(
              'flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
              screen === target ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" strokeWidth={screen === target ? 2.25 : 1.75} />
            {label}
          </a>
        ))}
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add expense"
          className="ml-2 grid size-13 shrink-0 place-items-center rounded-full bg-foreground text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-95 transition-transform"
        >
          <Plus className="size-6" strokeWidth={2.25} />
        </button>
      </div>
    </nav>
  )
}
