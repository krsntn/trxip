import type { Category, Expense, Trip } from '@/domain/types'

export interface Backup {
  app: 'trxip'
  version: 1
  exportedAt: string
  trip: Trip | null
  categories: Category[]
  expenses: Expense[]
}

/** A backup of data the caller already has. Lets the UI build the file inside a tap, with no database read. */
export function buildBackup(trip: Trip | null, categories: Category[], expenses: Expense[]): Backup {
  return { app: 'trxip', version: 1, exportedAt: new Date().toISOString(), trip, categories, expenses }
}

type Fields = Record<string, unknown>

const isObject = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isCurrency = (v: unknown) => isString(v) && /^[A-Z]{3}$/.test(v)

function isTrip(v: unknown): v is Trip {
  return isObject(v) && isCurrency(v.homeCurrency) && isCurrency(v.foreignCurrency) && isNumber(v.rate) && v.rate > 0
}

function isCategory(v: unknown): v is Category {
  return isObject(v) && isString(v.id) && isString(v.name) && isNumber(v.order)
}

function isExpense(v: unknown, categoryIds: Set<string>): v is Expense {
  return (
    isObject(v) &&
    isString(v.id) &&
    isString(v.date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    isString(v.categoryId) &&
    categoryIds.has(v.categoryId) &&
    isString(v.description) &&
    isNumber(v.amount) &&
    v.amount > 0 &&
    (v.currency === 'home' || v.currency === 'foreign') &&
    isNumber(v.createdAt)
  )
}

/** Checks that data read from a backup file is a complete, valid backup. */
export function parseBackup(data: unknown): Backup {
  const valid =
    isObject(data) &&
    data.app === 'trxip' &&
    data.version === 1 &&
    (data.trip === null || isTrip(data.trip)) &&
    Array.isArray(data.categories) &&
    data.categories.every(isCategory) &&
    Array.isArray(data.expenses) &&
    data.expenses.every((e) => isExpense(e, new Set((data.categories as Category[]).map((c) => c.id))))
  if (!valid) throw new Error('This file is not a Trxip backup, or it is damaged.')
  return data as unknown as Backup
}
