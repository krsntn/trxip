import { useLiveQuery } from 'dexie-react-hooks'
import { store } from '@/storage'

/**
 * Live trip data. Each value is undefined while it loads.
 * trip is null when the traveller has not set up a trip yet.
 */
export function useTripData() {
  const trip = useLiveQuery(async () => (await store.getTrip()) ?? null)
  const expenses = useLiveQuery(() => store.listExpenses())
  const categories = useLiveQuery(() => store.listCategories())
  return { trip, expenses, categories }
}
