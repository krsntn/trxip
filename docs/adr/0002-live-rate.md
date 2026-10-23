# Live rate: a rate change converts all expenses again

A trip has one rate, and every foreign-currency expense converts to the home currency at the current rate when it is shown. A rate change therefore changes the home amounts and totals of expenses saved earlier. We chose this over storing the rate on each expense because one rate fix corrects the whole trip, like a spreadsheet formula, and the traveller wants totals to follow the rate they set.

## Consequences

- Expenses store only the amount and currency the traveller typed. A home amount for a foreign-currency expense is never stored.
- Old rates are not kept, so a later change to per-expense rates can't recover the rates of existing expenses.
