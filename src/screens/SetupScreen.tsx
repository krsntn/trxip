import { RestoreButton } from '@/components/RestoreButton'
import { TripForm } from '@/components/TripForm'

export function SetupScreen() {
  return (
    <main className="mx-auto max-w-lg px-4 pt-[max(env(safe-area-inset-top),3rem)] pb-10">
      <p className="figures text-lg text-muted-foreground">Trxip</p>
      <h1 className="rule-double mt-1 pb-4 font-heading text-[2.5rem] leading-tight font-semibold">
        Set up your trip
      </h1>
      <p className="mt-4 mb-8 text-muted-foreground">
        Choose your currencies and type today's rate. You can change the rate at any time.
      </p>
      <TripForm submitLabel="Start tracking" />
      <div className="mt-10 border-t border-border pt-5 text-muted-foreground">
        <p>Moving from another phone?</p>
        <RestoreButton expenseCount={0} variant="link" />
      </div>
    </main>
  )
}
