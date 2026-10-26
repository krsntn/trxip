import { useEffect, useState } from 'react'
import { BottomBar } from '@/components/BottomBar'
import { ExpenseSheet, type SheetTarget } from '@/components/ExpenseSheet'
import { TopBar } from '@/components/TopBar'
import { useScreen } from '@/hooks/useScreen'
import { useTripData } from '@/hooks/useTripData'
import { useWide } from '@/hooks/useWide'
import { ConfigScreen } from '@/screens/ConfigScreen'
import { ExpensesScreen } from '@/screens/ExpensesScreen'
import { SetupScreen } from '@/screens/SetupScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'

function App() {
  const { trip, expenses, categories } = useTripData()
  const screen = useScreen()
  const wide = useWide()
  const [sheet, setSheet] = useState<SheetTarget>(null)
  const ready = !!trip

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  // Web layout: N opens a new expense, unless the traveller is typing or a dialog is open.
  useEffect(() => {
    if (!wide || !ready) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'n' || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      if ((event.target as Element).closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      event.preventDefault()
      setSheet('new')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [wide, ready])

  if (trip === undefined || expenses === undefined || categories === undefined) return null
  if (trip === null) return <SetupScreen />

  const data = { trip, expenses, categories }
  const expenseSheet = (
    <ExpenseSheet target={sheet} onClose={() => setSheet(null)} trip={trip} categories={categories} />
  )

  if (wide) {
    return (
      <>
        <TopBar screen={screen} trip={trip} onAdd={() => setSheet('new')} />
        <main className="mx-auto max-w-[1200px] px-6 pt-6 pb-16">
          {screen === 'config' ? (
            <div className="mx-auto max-w-[640px]">
              <ConfigScreen {...data} />
            </div>
          ) : (
            // Expenses and Summary side by side. The summary stays in view and scrolls on its own when it is too tall.
            <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-8">
              <div>
                <ExpensesScreen {...data} onEdit={setSheet} wide />
              </div>
              <aside className="sticky top-[calc(3.5rem+env(safe-area-inset-top)+1.5rem)] max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-3rem)] overflow-y-auto">
                <SummaryScreen {...data} wide />
              </aside>
            </div>
          )}
        </main>
        {expenseSheet}
      </>
    )
  }

  return (
    <>
      <main className="mx-auto max-w-lg pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {screen === 'expenses' && <ExpensesScreen {...data} onEdit={setSheet} />}
        {screen === 'summary' && <SummaryScreen {...data} />}
        {screen === 'config' && <ConfigScreen {...data} />}
      </main>
      <BottomBar screen={screen} onAdd={() => setSheet('new')} />
      {expenseSheet}
    </>
  )
}

export default App
