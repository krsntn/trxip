import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { readBackupFile } from '@/lib/files'
import { type Backup, parseBackup, store } from '@/storage'

const plural = (n: number) => `${n} ${n === 1 ? 'expense' : 'expenses'}`

const backupDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

/**
 * Picks a backup file and restores it.
 * It checks the file first, so it never asks to restore a file that is not a backup.
 * With expenseCount > 0 it asks before it restores, because a restore replaces all data.
 */
export function RestoreButton({
  expenseCount,
  variant = 'outline',
  className,
}: {
  expenseCount: number
  variant?: 'outline' | 'link'
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)

  async function restore(data: Backup) {
    try {
      await store.restoreBackup(data)
      setMessage({ error: false, text: 'Backup restored.' })
    } catch (e) {
      setMessage({ error: true, text: (e as Error).message })
    }
  }

  async function pick(file: File | undefined) {
    if (!file) return
    setMessage(null)
    try {
      const data = parseBackup(await readBackupFile(file))
      if (expenseCount > 0) setPending(data)
      else await restore(data)
    } catch (e) {
      setMessage({ error: true, text: (e as Error).message })
    }
  }

  return (
    <div className={className}>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <Button
        type="button"
        variant={variant}
        className={variant === 'link' ? 'h-auto px-0 text-base' : 'h-11 w-full text-base'}
        onClick={() => input.current?.click()}
      >
        Restore from backup
      </Button>
      {message && (
        <p role={message.error ? 'alert' : 'status'} className={message.error ? 'mt-2 text-sm text-destructive' : 'mt-2 text-sm text-muted-foreground'}>
          {message.text}
        </p>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all data with this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  The backup from {backupDate(pending.exportedAt)} has {plural(pending.expenses.length)}. It replaces
                  the {plural(expenseCount)}, the categories and the rate on this device.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pending) void restore(pending)
                setPending(null)
              }}
            >
              Replace data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
