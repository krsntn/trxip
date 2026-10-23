import { useState, type FormEvent } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { homeAmount } from '@/domain/money'
import type { Category, Expense, Trip } from '@/domain/types'
import { formatAmount, parseAmount, today } from '@/lib/format'
import { cn } from '@/lib/utils'
import { store } from '@/storage'
import { controlClass, Field } from './Field'

/** null closes the sheet, 'new' adds an expense, an expense edits it. */
export type SheetTarget = Expense | 'new' | null

export function ExpenseSheet({
  target,
  onClose,
  trip,
  categories,
}: {
  target: SheetTarget
  onClose: () => void
  trip: Trip
  categories: Category[]
}) {
  // Keep the last target so the form keeps its content while the sheet animates closed.
  // Each opening gets a new form key, so the form starts fresh.
  const [shown, setShown] = useState<Exclude<SheetTarget, null>>('new')
  const [openCount, setOpenCount] = useState(0)
  const [previous, setPrevious] = useState<SheetTarget>(null)
  if (target !== previous) {
    setPrevious(target)
    if (target !== null) {
      setShown(target)
      setOpenCount((n) => n + 1)
    }
  }

  return (
    <Drawer open={target !== null} onOpenChange={(open) => !open && onClose()} repositionInputs={false}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader className="px-4 pb-0 text-left">
          <DrawerTitle className="font-heading text-xl font-semibold">
            {shown === 'new' ? 'New expense' : 'Edit expense'}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Type the amount in {trip.foreignCurrency} or {trip.homeCurrency}.
          </DrawerDescription>
        </DrawerHeader>
        <ExpenseForm
          key={`${openCount}-${shown === 'new' ? 'new' : shown.id}`}
          expense={shown === 'new' ? null : shown}
          trip={trip}
          categories={categories}
          onDone={onClose}
        />
      </DrawerContent>
    </Drawer>
  )
}

function ExpenseForm({
  expense,
  trip,
  categories,
  onDone,
}: {
  expense: Expense | null
  trip: Trip
  categories: Category[]
  onDone: () => void
}) {
  const [currency, setCurrency] = useState<Expense['currency']>(expense?.currency ?? 'foreign')
  const [amountText, setAmountText] = useState(expense ? String(expense.amount) : '')
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [date, setDate] = useState(expense?.date ?? today())
  const [checked, setChecked] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const typedCurrency = currency === 'foreign' ? trip.foreignCurrency : trip.homeCurrency
  const amount = parseAmount(amountText, typedCurrency)
  const converted =
    currency === 'foreign' && amount.ok
      ? formatAmount(homeAmount({ ...blank, amount: amount.value, currency }, trip), trip.homeCurrency)
      : null

  const amountError = checked && !amount.ok ? amount.error : null
  const categoryError = checked && !categoryId ? 'Choose a category.' : null
  const dateError = checked && !date ? 'Choose a date.' : null

  function typeAmount(into: Expense['currency'], text: string) {
    setCurrency(into)
    setAmountText(text)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setChecked(true)
    if (!amount.ok || !categoryId || !date) return
    const fields = { amount: amount.value, currency, categoryId, description: description.trim(), date }
    try {
      if (expense) await store.updateExpense(expense.id, fields)
      else await store.addExpense(fields)
      onDone()
    } catch (e) {
      setSaveError((e as Error).message)
    }
  }

  async function remove() {
    if (!expense) return
    await store.deleteExpense(expense.id)
    onDone()
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5 overflow-y-auto px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <Field label="Amount" error={amountError}>
        <div className="grid grid-cols-2 gap-3">
          <AmountInput
            label={trip.foreignCurrency}
            foreign
            value={currency === 'foreign' ? amountText : ''}
            placeholder={currency === 'home' && amountText ? '' : '0'}
            onChange={(text) => typeAmount('foreign', text)}
            invalid={!!amountError && currency === 'foreign'}
          />
          <AmountInput
            label={trip.homeCurrency}
            value={currency === 'home' ? amountText : ''}
            placeholder={converted ?? '0.00'}
            onChange={(text) => typeAmount('home', text)}
            invalid={!!amountError && currency === 'home'}
          />
        </div>
      </Field>

      <Field label="Category" error={categoryError}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              className={cn(
                'h-9 rounded-full border px-3.5 text-[15px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                categoryId === c.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-input text-muted-foreground active:bg-muted',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label={
          <>
            Description <span className="text-muted-foreground/60">(optional)</span>
          </>
        }
        htmlFor="description"
      >
        <input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Taxi to hotel"
          autoComplete="off"
          enterKeyHint="done"
          className={controlClass}
        />
      </Field>

      <Field label="Date" htmlFor="date" error={dateError}>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={cn(controlClass, 'figures [color-scheme:dark]')}
        />
      </Field>

      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}

      <div className="flex gap-3">
        {expense && (
          <Button type="button" variant="destructive" className="h-11 px-4 text-base" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        )}
        <Button type="submit" className="h-11 flex-1 text-base">
          {expense ? 'Save changes' : 'Add expense'}
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>You can't undo this.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

/** Only amount and currency matter for a conversion preview. */
const blank: Expense = { id: '', date: '', categoryId: '', description: '', amount: 0, currency: 'foreign', createdAt: 0 }

function AmountInput({
  label,
  foreign = false,
  value,
  placeholder,
  onChange,
  invalid,
}: {
  label: string
  foreign?: boolean
  value: string
  placeholder: string
  onChange: (text: string) => void
  invalid: boolean
}) {
  const id = `amount-${label}`
  return (
    <div className="relative">
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        aria-label={`Amount in ${label}`}
        aria-invalid={invalid}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          controlClass,
          'figures h-14 pr-14 text-right text-2xl font-medium',
          foreign && 'text-foreign',
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          'figures pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm',
          foreign ? 'text-foreign/80' : 'text-muted-foreground',
        )}
      >
        {label}
      </label>
    </div>
  )
}
