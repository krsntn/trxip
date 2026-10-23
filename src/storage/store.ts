import Dexie, { type EntityTable } from 'dexie'
import type { Category, Expense, Trip } from '@/domain/types'
import { type Backup, buildBackup, parseBackup } from './backup'

const DEFAULT_CATEGORIES = ['Transport', 'Food', 'Shopping', 'Tickets', 'Accommodation', 'Other']

interface TripRow extends Trip {
  id: 'current'
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt'>

function checkAmount(amount: number) {
  if (!(amount > 0)) throw new Error('The amount must be greater than zero.')
}

class TrxipDB extends Dexie {
  expenses!: EntityTable<Expense, 'id'>
  categories!: EntityTable<Category, 'id'>
  trip!: EntityTable<TripRow, 'id'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      expenses: 'id, date, categoryId',
      categories: 'id, order',
      trip: 'id',
    })
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(
        DEFAULT_CATEGORIES.map((name, order) => ({ id: crypto.randomUUID(), name, order })),
      )
    })
  }
}

/** The one storage module (ADR 0001). All reads and writes go through it. */
export function createStore(name = 'trxip') {
  const db = new TrxipDB(name)

  async function getTrip(): Promise<Trip | undefined> {
    const row = await db.trip.get('current')
    if (!row) return undefined
    const { id: _, ...trip } = row
    return trip
  }

  /** Sets up the trip or changes its rate. The currencies can change only while the trip has no expenses. */
  async function saveTrip(trip: Trip): Promise<void> {
    if (!(trip.rate > 0)) throw new Error('The rate must be greater than zero.')
    await db.transaction('rw', db.trip, db.expenses, async () => {
      const current = await db.trip.get('current')
      const currenciesChange =
        current &&
        (current.homeCurrency !== trip.homeCurrency || current.foreignCurrency !== trip.foreignCurrency)
      if (currenciesChange && (await db.expenses.count()) > 0) {
        throw new Error('You can change the currencies only when the trip has no expenses.')
      }
      await db.trip.put({ ...trip, id: 'current' })
    })
  }

  function listCategories(): Promise<Category[]> {
    return db.categories.orderBy('order').toArray()
  }

  async function addCategory(name: string): Promise<Category> {
    return db.transaction('rw', db.categories, async () => {
      const last = await db.categories.orderBy('order').last()
      const category: Category = { id: crypto.randomUUID(), name: name.trim(), order: (last?.order ?? -1) + 1 }
      await db.categories.add(category)
      return category
    })
  }

  async function renameCategory(id: string, name: string): Promise<void> {
    await db.categories.update(id, { name: name.trim() })
  }

  /** Deletes a category. Blocked while any expense uses it. */
  async function deleteCategory(id: string): Promise<void> {
    await db.transaction('rw', db.categories, db.expenses, async () => {
      const used = await db.expenses.where('categoryId').equals(id).count()
      if (used > 0) {
        throw new Error(`${used} ${used === 1 ? 'expense uses' : 'expenses use'} this category. Move them first.`)
      }
      await db.categories.delete(id)
    })
  }

  function listExpenses(): Promise<Expense[]> {
    return db.expenses.toArray()
  }

  async function addExpense(input: NewExpense): Promise<Expense> {
    checkAmount(input.amount)
    const expense: Expense = { ...input, id: crypto.randomUUID(), createdAt: Date.now() }
    await db.expenses.add(expense)
    return expense
  }

  async function updateExpense(id: string, changes: Partial<NewExpense>): Promise<void> {
    if (changes.amount !== undefined) checkAmount(changes.amount)
    await db.expenses.update(id, changes)
  }

  async function deleteExpense(id: string): Promise<void> {
    await db.expenses.delete(id)
  }

  /** Deletes all expenses. The trip settings and categories stay. */
  async function startNewTrip(): Promise<void> {
    await db.expenses.clear()
  }

  async function createBackup(): Promise<Backup> {
    return db.transaction('r', db.trip, db.categories, db.expenses, async () =>
      buildBackup((await getTrip()) ?? null, await db.categories.toArray(), await db.expenses.toArray()),
    )
  }

  /** Replaces all data with the backup. */
  async function restoreBackup(data: unknown): Promise<void> {
    const backup = parseBackup(data)
    await db.transaction('rw', db.trip, db.categories, db.expenses, async () => {
      await Promise.all([db.trip.clear(), db.categories.clear(), db.expenses.clear()])
      if (backup.trip) await db.trip.put({ ...backup.trip, id: 'current' })
      await db.categories.bulkAdd(backup.categories)
      await db.expenses.bulkAdd(backup.expenses)
    })
  }

  return {
    getTrip,
    saveTrip,
    listCategories,
    addCategory,
    renameCategory,
    deleteCategory,
    listExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    startNewTrip,
    createBackup,
    restoreBackup,
  }
}

export type Store = ReturnType<typeof createStore>
