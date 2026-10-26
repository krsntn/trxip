import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { controlClass } from '@/components/Field'
import { RestoreButton } from '@/components/RestoreButton'
import { TripForm } from '@/components/TripForm'
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
import type { Category } from '@/domain/types'
import { backUp, exportCsv, type TripData } from '@/lib/files'
import { store } from '@/storage'

export function ConfigScreen(data: TripData) {
  const { trip, expenses, categories } = data
  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="font-heading text-2xl font-semibold">Config</h1>

      <Section title="Trip">
        <TripForm initial={trip} currenciesLocked={expenses.length > 0} submitLabel="Save changes" />
      </Section>

      <Section title="Categories">
        <CategoryEditor categories={categories} />
      </Section>

      <Section title="Data" note="Your data is stored only on this device. Back up often.">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11 text-base" onClick={() => void exportCsv(data)}>
            Export CSV
          </Button>
          <Button variant="outline" className="h-11 text-base" onClick={() => void backUp(data)}>
            Back up
          </Button>
        </div>
        <RestoreButton expenseCount={expenses.length} className="mt-3" />
      </Section>

      <Section title="New trip" note="Deletes all data and opens the setup page again.">
        <NewTripButton data={data} />
      </Section>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-border pt-5">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function CategoryEditor({ categories }: { categories: Category[] }) {
  const [newName, setNewName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!newName.trim()) return
    await store.addCategory(newName)
    setNewName('')
  }

  async function remove(category: Category) {
    try {
      await store.deleteCategory(category.id)
    } catch (e) {
      setErrors((all) => ({ ...all, [category.id]: (e as Error).message }))
    }
  }

  async function rename(category: Category, name: string) {
    setErrors((all) => {
      const next = { ...all }
      delete next[category.id]
      return next
    })
    if (name.trim() && name.trim() !== category.name) await store.renameCategory(category.id, name)
  }

  return (
    <div className="flex flex-col gap-2">
      {categories.map((c) => (
        <div key={c.id}>
          <div className="flex gap-2">
            <input
              key={c.name}
              aria-label={`Category name: ${c.name}`}
              defaultValue={c.name}
              enterKeyHint="done"
              onBlur={(e) => {
                if (!e.target.value.trim()) e.target.value = c.name
                void rename(c, e.target.value)
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className={controlClass}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-muted-foreground"
              aria-label={`Delete ${c.name}`}
              onClick={() => void remove(c)}
            >
              <Trash2 className="size-5" />
            </Button>
          </div>
          {errors[c.id] && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {errors[c.id]}
            </p>
          )}
        </div>
      ))}
      <form onSubmit={add} className="flex gap-2">
        <input
          aria-label="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          enterKeyHint="done"
          className={controlClass}
        />
        <Button type="submit" variant="secondary" size="icon" className="size-11 shrink-0" aria-label="Add category">
          <Plus className="size-5" />
        </Button>
      </form>
    </div>
  )
}

function NewTripButton({ data }: { data: TripData }) {
  const [open, setOpen] = useState(false)

  async function startOver() {
    await store.startNewTrip()
    // With no trip, the app shows the setup page. After setup, it opens the Expenses screen, not Config.
    window.location.replace('#/')
  }

  return (
    <>
      <Button variant="destructive" className="h-11 w-full text-base" onClick={() => setOpen(true)}>
        Start new trip
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all data on this device: expenses, categories, currencies and rate. To keep a copy of this
              trip, back up first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => void backUp(data)}>
              Back up
            </Button>
            <AlertDialogAction variant="destructive" onClick={() => void startOver()}>
              Delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
