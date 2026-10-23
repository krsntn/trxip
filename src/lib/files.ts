import { expensesToCsv } from '@/domain/csv'
import type { Category, Expense, Trip } from '@/domain/types'
import { buildBackup } from '@/storage'
import { today } from './format'

/** The data on screen. Files are built from it, so a tap can open the share sheet with no database read first. */
export interface TripData {
  trip: Trip
  expenses: Expense[]
  categories: Category[]
}

export function exportCsv({ trip, expenses, categories }: TripData) {
  // The byte-order mark makes Excel read the file as UTF-8.
  const csv = '﻿' + expensesToCsv(expenses, categories, trip)
  return saveFile(new File([csv], `trxip-${today()}.csv`, { type: 'text/csv' }))
}

export function backUp({ trip, expenses, categories }: TripData) {
  const json = JSON.stringify(buildBackup(trip, categories, expenses), null, 2)
  return saveFile(new File([json], `trxip-backup-${today()}.json`, { type: 'application/json' }))
}

/**
 * On a phone that can share this file, opens the share sheet ("Save to Files" on iPhone).
 * Everywhere else, or if sharing fails, downloads the file.
 * Call it straight from a tap: Safari opens the share sheet only right after a tap.
 */
async function saveFile(file: File) {
  const phone = window.matchMedia('(pointer: coarse)').matches
  if (phone && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return // The traveller closed the share sheet.
    }
  }
  download(file)
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Reads a backup file. Throws if the file is not JSON. The store checks the content. */
export async function readBackupFile(file: File): Promise<unknown> {
  try {
    return JSON.parse(await file.text())
  } catch {
    throw new Error('This file is not a Trxip backup, or it is damaged.')
  }
}
