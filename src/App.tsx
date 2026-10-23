import { useEffect, useState } from 'react'
import { BottomBar } from '@/components/BottomBar'
import { ExpenseSheet, type SheetTarget } from '@/components/ExpenseSheet'
import { useScreen } from '@/hooks/useScreen'
import { useTripData } from '@/hooks/useTripData'
import { ConfigScreen } from '@/screens/ConfigScreen'
import { ExpensesScreen } from '@/screens/ExpensesScreen'
import { SetupScreen } from '@/screens/SetupScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'

function App() {
  const { trip, expenses, categories } = useTripData()
  const screen = useScreen()
  const [sheet, setSheet] = useState<SheetTarget>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  if (trip === undefined || expenses === undefined || categories === undefined) return null
  if (trip === null) return <SetupScreen />

  const data = { trip, expenses, categories }

  return (
    <>
      <main className="mx-auto max-w-lg pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {screen === 'expenses' && <ExpensesScreen {...data} onEdit={setSheet} />}
        {screen === 'summary' && <SummaryScreen {...data} />}
        {screen === 'config' && <ConfigScreen {...data} />}
      </main>
      <BottomBar screen={screen} onAdd={() => setSheet('new')} />
      <ExpenseSheet target={sheet} onClose={() => setSheet(null)} trip={trip} categories={categories} />
    </>
  )
}

export default App
