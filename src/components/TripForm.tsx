import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/domain/types'
import { parseRate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { store } from '@/storage'
import { CurrencyPicker } from './CurrencyPicker'
import { controlClass, Field } from './Field'

/** Currencies and rate. Used to set up a trip and to change it on the config page. */
export function TripForm({
  initial,
  currenciesLocked = false,
  submitLabel,
  onSaved,
}: {
  initial?: Trip
  currenciesLocked?: boolean
  submitLabel: string
  onSaved?: () => void
}) {
  const [home, setHome] = useState(initial?.homeCurrency ?? 'MYR')
  const [foreign, setForeign] = useState(initial?.foreignCurrency ?? '')
  const [rateText, setRateText] = useState(initial ? String(initial.rate) : '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // When the stored trip changes outside this form, for example after a restore, show the stored values.
  // After a save in this form, the stored trip already matches the form, so nothing changes.
  const stored = initial && `${initial.homeCurrency} ${initial.foreignCurrency} ${initial.rate}`
  const [previous, setPrevious] = useState(stored)
  if (stored !== previous) {
    setPrevious(stored)
    if (initial && stored !== `${home} ${foreign} ${rateText}`) {
      setHome(initial.homeCurrency)
      setForeign(initial.foreignCurrency)
      setRateText(String(initial.rate))
      setError(null)
      setSaved(false)
    }
  }

  const changed =
    !initial || home !== initial.homeCurrency || foreign !== initial.foreignCurrency || rateText !== String(initial.rate)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const rate = parseRate(rateText)
    if (!foreign) return setError('Choose the foreign currency.')
    if (foreign === home) return setError('The foreign currency must be different from the home currency.')
    if (rate === null) return setError(`Type how many ${foreign} equal 1 ${home}, for example 32.68.`)
    try {
      await store.saveTrip({ homeCurrency: home, foreignCurrency: foreign, rate })
      setError(null)
      setRateText(String(rate))
      setSaved(true)
      onSaved?.()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function edit<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value)
      setSaved(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Home currency" htmlFor="home-currency">
          <CurrencyPicker id="home-currency" value={home} onChange={edit(setHome)} disabled={currenciesLocked} />
        </Field>
        <Field label="Foreign currency" htmlFor="foreign-currency">
          <CurrencyPicker
            id="foreign-currency"
            value={foreign}
            onChange={edit(setForeign)}
            disabled={currenciesLocked}
            foreign
          />
        </Field>
      </div>
      {currenciesLocked && (
        <p className="-mt-2 text-sm text-muted-foreground">
          To change the currencies, start a new trip first.
        </p>
      )}

      <Field
        label="Rate"
        htmlFor="rate"
        error={error}
        hint={currenciesLocked ? `A new rate also changes the ${home} amount of every ${foreign} expense.` : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="figures shrink-0 text-lg">1 {home} =</span>
          <input
            id="rate"
            inputMode="decimal"
            autoComplete="off"
            value={rateText}
            onChange={(e) => edit(setRateText)(e.target.value)}
            placeholder="32.68"
            className={cn(controlClass, 'figures text-lg')}
          />
          <span className="figures shrink-0 text-lg text-foreign">{foreign || '…'}</span>
        </div>
      </Field>

      <Button type="submit" className="h-11 w-full text-base" disabled={!changed && !!initial}>
        {saved && initial ? 'Saved' : submitLabel}
      </Button>
    </form>
  )
}
