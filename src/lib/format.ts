import { currencyDecimals } from '@/domain/money'
import type { CurrencyCode } from '@/domain/types'

/** "1,000" for JPY, "30.60" for MYR. */
export function formatAmount(value: number, currency: CurrencyCode): string {
  const decimals = currencyDecimals(currency)
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export type ParsedAmount = { ok: true; value: number } | { ok: false; error: string }

/** Reads a typed amount. Accepts "1,200" and "30.6"; rejects more decimals than the currency has. */
export function parseAmount(text: string, currency: CurrencyCode): ParsedAmount {
  const clean = text.replaceAll(',', '').trim()
  if (clean === '') return { ok: false, error: 'Type an amount.' }
  if (!/^\d*\.?\d*$/.test(clean) || clean === '.') return { ok: false, error: 'Type a number, for example 1200 or 30.50.' }
  const decimals = currencyDecimals(currency)
  const typedDecimals = clean.split('.')[1]?.length ?? 0
  if (typedDecimals > decimals) {
    return {
      ok: false,
      error: decimals === 0 ? `${currency} has no decimals.` : `${currency} has ${decimals} decimals at most.`,
    }
  }
  const value = Number(clean)
  if (!(value > 0)) return { ok: false, error: 'The amount must be greater than zero.' }
  return { ok: true, value }
}

/** Reads a typed rate. Any positive number. */
export function parseRate(text: string): number | null {
  const value = Number(text.replaceAll(',', '').trim())
  return Number.isFinite(value) && value > 0 ? value : null
}

/** Today's calendar date on this device, as YYYY-MM-DD. */
export function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const thisYear = (value: Date) => value.getFullYear() === new Date().getFullYear()

/** "Sat 14 Nov". Adds the year when it is not this year. */
export function formatDay(date: string): string {
  const value = toDate(date)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(thisYear(value) ? {} : { year: 'numeric' }),
  })
    .format(value)
    .replace(',', '')
}

/** "13–18 Nov", "30 Oct – 2 Nov", or "14 Nov" for one day. Adds the years when a date is not this year. */
export function formatDayRange(first: string, last: string): string {
  const [from, to] = [toDate(first), toDate(last)]
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(thisYear(from) && thisYear(to) ? {} : { year: 'numeric' }),
  }).formatRange(from, to)
}
