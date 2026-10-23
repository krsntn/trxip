import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { Trip } from '@/domain/types'
import { createStore } from './store'

const japan: Trip = { homeCurrency: 'MYR', foreignCurrency: 'JPY', rate: 32.68 }

function freshStore() {
  return createStore(`test-${crypto.randomUUID()}`)
}

describe('store', () => {
  it('starts with no trip and the default categories, and saves the trip', async () => {
    const store = freshStore()

    expect(await store.getTrip()).toBeUndefined()
    expect((await store.listCategories()).map((c) => c.name)).toEqual([
      'Transport',
      'Food',
      'Shopping',
      'Tickets',
      'Accommodation',
      'Other',
    ])

    await store.saveTrip(japan)
    expect(await store.getTrip()).toEqual(japan)
  })

  it('saves an expense and rejects an amount that is not greater than zero', async () => {
    const store = freshStore()
    await store.saveTrip(japan)
    const [transport] = await store.listCategories()

    const taxi = await store.addExpense({
      date: '2026-11-14',
      categoryId: transport.id,
      description: 'taxi to hall',
      amount: 1000,
      currency: 'foreign',
    })

    expect(await store.listExpenses()).toEqual([taxi])
    expect(taxi).toMatchObject({ description: 'taxi to hall', amount: 1000, currency: 'foreign' })
    await expect(
      store.addExpense({ date: '2026-11-14', categoryId: transport.id, description: '', amount: 0, currency: 'home' }),
    ).rejects.toThrow('greater than zero')
    expect(await store.listExpenses()).toHaveLength(1)
  })

  it('edits an expense without changing its save order, and deletes it', async () => {
    const store = freshStore()
    const [transport, food] = await store.listCategories()
    const taxi = await store.addExpense({ date: '2026-11-14', categoryId: transport.id, description: 'taxi', amount: 1000, currency: 'foreign' })

    await store.updateExpense(taxi.id, { categoryId: food.id, description: 'ramen', amount: 50, currency: 'home' })
    expect(await store.listExpenses()).toEqual([
      { ...taxi, categoryId: food.id, description: 'ramen', amount: 50, currency: 'home' },
    ])
    await expect(store.updateExpense(taxi.id, { amount: -5 })).rejects.toThrow('greater than zero')

    await store.deleteExpense(taxi.id)
    expect(await store.listExpenses()).toEqual([])
  })

  it('always allows a rate change, but locks the currencies while the trip has expenses', async () => {
    const store = freshStore()
    await store.saveTrip(japan)
    const [transport] = await store.listCategories()
    await store.addExpense({ date: '2026-11-14', categoryId: transport.id, description: '', amount: 1000, currency: 'foreign' })

    await store.saveTrip({ ...japan, rate: 33.1 })
    await expect(store.saveTrip({ ...japan, foreignCurrency: 'THB' })).rejects.toThrow('currencies')
    await expect(store.saveTrip({ ...japan, homeCurrency: 'SGD' })).rejects.toThrow('currencies')

    expect(await store.getTrip()).toEqual({ ...japan, rate: 33.1 })
  })

  it('rejects a rate that is not greater than zero', async () => {
    const store = freshStore()
    await store.saveTrip(japan)

    await expect(store.saveTrip({ ...japan, rate: 0 })).rejects.toThrow('greater than zero')
    expect(await store.getTrip()).toEqual(japan)
  })

  it('starts a new trip by deleting all expenses, keeping the categories, and unlocking the currencies', async () => {
    const store = freshStore()
    await store.saveTrip(japan)
    const souvenirs = await store.addCategory('Souvenirs')
    await store.addExpense({ date: '2026-11-14', categoryId: souvenirs.id, description: '', amount: 1000, currency: 'foreign' })
    const categoriesBefore = await store.listCategories()

    await store.startNewTrip()

    expect(await store.listExpenses()).toEqual([])
    expect(await store.listCategories()).toEqual(categoriesBefore)
    expect(await store.getTrip()).toEqual(japan)
    const thailand: Trip = { homeCurrency: 'MYR', foreignCurrency: 'THB', rate: 7.7 }
    await store.saveTrip(thailand)
    expect(await store.getTrip()).toEqual(thailand)
  })

  it('restores a backup into another store, replacing all of its data', async () => {
    const phone = freshStore()
    await phone.saveTrip(japan)
    const souvenirs = await phone.addCategory('Souvenirs')
    await phone.addExpense({ date: '2026-11-14', categoryId: souvenirs.id, description: 'keychain', amount: 800, currency: 'foreign' })
    await phone.addExpense({ date: '2026-11-15', categoryId: souvenirs.id, description: 'sim card', amount: 50, currency: 'home' })
    const file = JSON.stringify(await phone.createBackup())

    const newPhone = freshStore()
    await newPhone.saveTrip({ homeCurrency: 'MYR', foreignCurrency: 'THB', rate: 7.7 })
    await newPhone.addExpense({ date: '2026-01-01', categoryId: (await newPhone.listCategories())[0].id, description: 'old', amount: 1, currency: 'home' })
    await newPhone.restoreBackup(JSON.parse(file))

    expect(await newPhone.getTrip()).toEqual(await phone.getTrip())
    expect(await newPhone.listCategories()).toEqual(await phone.listCategories())
    expect(await newPhone.listExpenses()).toEqual(await phone.listExpenses())
  })

  it('rejects a file that is not a valid backup and keeps the current data', async () => {
    const store = freshStore()
    await store.saveTrip(japan)
    const [transport] = await store.listCategories()
    await store.addExpense({ date: '2026-11-14', categoryId: transport.id, description: '', amount: 1000, currency: 'foreign' })
    const before = await store.createBackup()

    await expect(store.restoreBackup({ hello: 'world' })).rejects.toThrow('not a Trxip backup')
    await expect(
      store.restoreBackup({
        ...before,
        expenses: [{ ...before.expenses[0], amount: -1 }],
      }),
    ).rejects.toThrow('not a Trxip backup')
    await expect(
      store.restoreBackup({ ...before, expenses: [{ ...before.expenses[0], categoryId: 'missing' }] }),
    ).rejects.toThrow('not a Trxip backup')

    expect(await store.listExpenses()).toEqual(before.expenses)
    expect(await store.getTrip()).toEqual(japan)
  })

  it('blocks deleting a category that expenses use, and says how many use it', async () => {
    const store = freshStore()
    await store.saveTrip(japan)
    const [transport] = await store.listCategories()
    for (const amount of [1000, 2000]) {
      await store.addExpense({ date: '2026-11-14', categoryId: transport.id, description: '', amount, currency: 'foreign' })
    }

    await expect(store.deleteCategory(transport.id)).rejects.toThrow('2 expenses')
    expect((await store.listCategories()).map((c) => c.name)).toContain('Transport')
  })

  it('adds a category at the end of the list, renames it, and deletes it while unused', async () => {
    const store = freshStore()
    const names = async () => (await store.listCategories()).map((c) => c.name)

    const souvenirs = await store.addCategory('Souvenirs')
    expect((await names()).at(-1)).toBe('Souvenirs')

    await store.renameCategory(souvenirs.id, 'Gifts')
    expect((await names()).at(-1)).toBe('Gifts')

    await store.deleteCategory(souvenirs.id)
    expect(await names()).not.toContain('Gifts')
  })
})
