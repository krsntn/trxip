# Trxip

A travel expense tracker. It keeps one list of expenses for the current trip and shows each amount in the home currency and the foreign currency.

## Language

### Money

**Home Currency**:
The currency of the traveller's own country (for example MYR). Every expense has a home amount.
_Avoid_: Base currency, local currency

**Foreign Currency**:
The currency of the country the traveller visits (for example JPY). An expense has a foreign amount only when the traveller paid in this currency.
_Avoid_: Local currency, destination currency

**Rate**:
The number of foreign currency units that equal one home currency unit (for example 1 MYR = 32.68 JPY). Every foreign amount converts to a home amount at the current rate, so a rate change changes all converted home amounts.
_Avoid_: Exchange rate snapshot, historical rate

### Expenses

**Trip**:
The one current set of expenses, with its home currency, foreign currency and rate. Only one trip exists at a time. Starting a new trip deletes all expenses, and the currencies can change only when the trip has no expenses.
_Avoid_: Sheet, ledger, book

**Expense**:
One payment made during the trip, with a date, a category, a description and one amount, typed in either the foreign currency or the home currency. A foreign-currency expense shows its home amount converted at the current rate and rounded to the home currency's decimals; all totals add these rounded amounts. A home-currency expense has no foreign amount. The amount is always greater than zero; a refund changes or deletes the original expense.
_Avoid_: Transaction, entry, item, record

**Category**:
A label for the kind of expense (for example Transport, Food, Shopping). The traveller edits the list. A category that an expense uses can't be deleted.
_Avoid_: Type, tag, group

### Totals

**Day Total**:
The sum of the home amounts of all expenses on one date.
_Avoid_: Subtotal, daily sum

**Trip Total**:
The sum of the home amounts of all expenses in the trip. There is no foreign-currency total.
_Avoid_: Grand total, balance

**Category Summary**:
The trip total split by category, with each category's home amount and its percentage of the trip total.
_Avoid_: Report, breakdown, dashboard

### Data

**Export**:
A CSV copy of the trip's expenses for a spreadsheet. The app can't read an export back.
_Avoid_: Backup, download

**Backup**:
A file with all app data (expenses, currencies, rate and categories) that the app can restore. A restore replaces all current data.
_Avoid_: Export, snapshot
