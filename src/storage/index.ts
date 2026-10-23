import { createStore } from './store'

export { type Backup, buildBackup, parseBackup } from './backup'
export type { NewExpense, Store } from './store'

/** The app's one store. Tests create their own with createStore(). */
export const store = createStore()
