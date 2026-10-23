/** ISO 4217 code, for example "MYR" or "JPY". */
export type CurrencyCode = string

export interface Trip {
  homeCurrency: CurrencyCode
  foreignCurrency: CurrencyCode
  /** Foreign currency units that equal one home currency unit (1 MYR = 32.68 JPY → 32.68). */
  rate: number
}

export interface Category {
  id: string
  name: string
  /** Position in the category list. */
  order: number
}

export interface Expense {
  id: string
  /** Calendar date where the traveller is, as YYYY-MM-DD. */
  date: string
  categoryId: string
  description: string
  /** The amount the traveller typed. Always greater than zero. */
  amount: number
  /** The currency the amount was typed in. */
  currency: 'home' | 'foreign'
  /** Save time in ms. Orders expenses within one date. */
  createdAt: number
}
