import { Loader2 } from 'lucide-react'
import type QrScanner from 'qr-scanner'
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import { QrCode } from '@/components/QrCode'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { TripData } from '@/lib/files'
import { formatExpenseCount } from '@/lib/format'
import {
  CODE_MINUTES,
  CodeExpiredError,
  download,
  formatCode,
  newCode,
  parseCode,
  type TransferCode,
  upload,
} from '@/lib/transfer'
import { cn } from '@/lib/utils'
import { type Backup, buildBackup, parseBackup, store } from '@/storage'

/*
 * Copy all data to another device with a QR code (ADR 0003).
 * Send and Receive show a code. Scan code reads it with the camera, so a phone always scans.
 * The code says what the scanning device does: get the data (Send) or send its own data (Receive).
 */

type Variant = 'outline' | 'link'
type Note = { error: boolean; text: string }

const SCAN_HINT = 'On the other device, open Trxip and tap Scan code. It is in Config, and on the setup page.'

const triggerClass = (variant: Variant) => (variant === 'link' ? 'h-auto px-0 text-base' : 'h-11 w-full text-base')

/** Stores this device's data on the relay and shows a code. The other device scans it to get the data. */
export function SendButton({ data, children }: { data: TripData; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<TransferCode | null>(null)
  const [note, setNote] = useState<Note | null>(null)

  async function start() {
    setCode(null)
    setNote(null)
    setOpen(true)
    try {
      const next = newCode('send')
      await upload(next, buildBackup(data.trip, data.categories, data.expenses))
      setCode(next)
    } catch (e) {
      setNote({ error: true, text: (e as Error).message })
    }
  }

  return (
    <>
      <Button variant="outline" className={triggerClass('outline')} onClick={() => void start()}>
        {children}
      </Button>
      <TransferDialog open={open} onOpenChange={setOpen} title="Send to another device" description={SCAN_HINT}>
        {note ? (
          <NoteView note={note} action={<Button onClick={() => void start()}>Try again</Button>} />
        ) : code ? (
          <>
            <QrCode text={formatCode(code)} label="Code for the other device" className="mx-auto w-full max-w-64" />
            <p className="mt-4 text-sm text-muted-foreground">
              It sends {formatExpenseCount(data.expenses.length)}. The code works one time, for {CODE_MINUTES} minutes.
            </p>
          </>
        ) : (
          <Waiting>Making the code</Waiting>
        )}
      </TransferDialog>
    </>
  )
}

/** Shows a code and waits until the other device scans it and sends its data. */
export function ReceiveButton({
  expenseCount,
  variant = 'outline',
  children,
}: {
  expenseCount: number
  variant?: Variant
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<TransferCode | null>(null)
  const [expired, setExpired] = useState(false)
  const incoming = useIncoming(expenseCount)

  function start() {
    incoming.reset()
    setExpired(false)
    setCode(newCode('receive'))
    setOpen(true)
  }

  const onData = useEffectEvent((data: unknown) => incoming.accept(data))
  const onFail = useEffectEvent((e: unknown) => {
    if (e instanceof CodeExpiredError) setExpired(true)
    else incoming.setNote({ error: true, text: (e as Error).message })
  })

  useEffect(() => {
    if (!open || !code) return
    const controller = new AbortController()
    download(code, { wait: true, signal: controller.signal }).then(onData, (e) => {
      if (!controller.signal.aborted) onFail(e)
    })
    return () => controller.abort()
  }, [open, code])

  return (
    <>
      <Button variant={variant} className={triggerClass(variant)} onClick={start}>
        {children}
      </Button>
      <TransferDialog open={open} onOpenChange={setOpen} title="Receive from another device" description={SCAN_HINT}>
        <IncomingView incoming={incoming} onClose={() => setOpen(false)} onRetry={start}>
          {code && (
            <QrCode
              text={formatCode(code)}
              label="Code for the other device"
              className={cn('mx-auto w-full max-w-64', expired && 'opacity-20')}
            />
          )}
          {expired ? (
            <>
              <p className="mt-4">The code expired.</p>
              <Button className="mt-4" onClick={start}>
                Show a new code
              </Button>
            </>
          ) : (
            <Waiting className="mt-4">Waiting for the other device. The code works for {CODE_MINUTES} minutes.</Waiting>
          )}
        </IncomingView>
      </TransferDialog>
    </>
  )
}

/**
 * Opens the camera and scans a code from the other device.
 * A Send code gets the other device's data. A Receive code sends this device's data.
 * data is null on the setup page, where this device has no trip to send.
 */
export function ScanButton({
  data,
  variant = 'outline',
  children,
}: {
  data: TripData | null
  variant?: Variant
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [hint, setHint] = useState<string | null>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const incoming = useIncoming(data?.expenses.length ?? 0)

  function start() {
    incoming.reset()
    setHint(null)
    setScanning(true)
    setOpen(true)
  }

  async function getData(code: TransferCode) {
    try {
      incoming.accept(await download(code, { wait: false }))
    } catch (e) {
      incoming.setNote({ error: true, text: (e as Error).message })
    }
  }

  async function sendData(code: TransferCode) {
    if (!data) {
      incoming.setNote({
        error: true,
        text: 'This device has no trip to send. To get a trip, tap Send on the other device and scan its code.',
      })
      return
    }
    try {
      await upload(code, buildBackup(data.trip, data.categories, data.expenses))
      incoming.setNote({ error: false, text: `Sent ${formatExpenseCount(data.expenses.length)} to the other device.` })
    } catch (e) {
      incoming.setNote({ error: true, text: (e as Error).message })
    }
  }

  /** Returns true when the text is a Trxip code, so the scanner stops. */
  const onScan = useEffectEvent((text: string) => {
    const code = parseCode(text)
    if (!code) {
      setHint('This is not a Trxip code.')
      return false
    }
    setScanning(false)
    void (code.kind === 'send' ? getData(code) : sendData(code))
    return true
  })
  const onCameraError = useEffectEvent((e: unknown) => {
    setScanning(false)
    incoming.setNote({
      error: true,
      text:
        (e as DOMException)?.name === 'NotAllowedError'
          ? 'Trxip cannot use the camera. Allow camera access for this site in the settings, then try again.'
          : 'Trxip cannot open a camera on this device.',
    })
  })

  useEffect(() => {
    if (!open || !scanning || !video) return
    let scanner: QrScanner | undefined
    let stopped = false
    // The scanner loads only when it is needed.
    void import('qr-scanner').then(({ default: Scanner }) => {
      if (stopped) return
      scanner = new Scanner(
        video,
        (result) => {
          if (!stopped && onScan(result.data)) {
            stopped = true
            scanner?.stop()
          }
        },
        {
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
          maxScansPerSecond: 8,
          // Scan the whole square that the dialog shows. The default, the center 2/3, cuts off a code that fills the view.
          calculateScanRegion: ({ videoWidth: width, videoHeight: height }) => {
            const size = Math.min(width, height)
            const scaled = Math.min(size, 800)
            return { x: (width - size) / 2, y: (height - size) / 2, width: size, height: size, downScaledWidth: scaled, downScaledHeight: scaled }
          },
        },
      )
      scanner.start().catch((e) => !stopped && onCameraError(e))
    })
    return () => {
      stopped = true
      scanner?.destroy()
    }
  }, [open, scanning, video])

  return (
    <>
      <Button variant={variant} className={triggerClass(variant)} onClick={start}>
        {children}
      </Button>
      <TransferDialog
        open={open}
        onOpenChange={setOpen}
        title="Scan code"
        description="On the other device, open Trxip and tap Send or Receive. Then point this camera at its code."
      >
        <IncomingView incoming={incoming} onClose={() => setOpen(false)} onRetry={start}>
          {scanning ? (
            <>
              <video
                ref={setVideo}
                muted
                playsInline
                className="aspect-square w-full rounded-lg bg-black object-cover"
              />
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                {hint ?? 'Point the camera at the code.'}
              </p>
            </>
          ) : (
            <Waiting>Copying the data</Waiting>
          )}
        </IncomingView>
      </TransferDialog>
    </>
  )
}

/**
 * Data that comes from the other device. With expenses on this device, it asks before it restores,
 * because a restore replaces all data. The note is the result of the copy.
 */
function useIncoming(expenseCount: number) {
  const [pending, setPending] = useState<Backup | null>(null)
  const [note, setNote] = useState<Note | null>(null)

  async function restore(backup: Backup) {
    setPending(null)
    try {
      await store.restoreBackup(backup)
      setNote({ error: false, text: `Received ${formatExpenseCount(backup.expenses.length)}.` })
    } catch (e) {
      setNote({ error: true, text: (e as Error).message })
    }
  }

  function accept(data: unknown) {
    try {
      const backup = parseBackup(data)
      if (expenseCount > 0) setPending(backup)
      else void restore(backup)
    } catch (e) {
      setNote({ error: true, text: (e as Error).message })
    }
  }

  function reset() {
    setPending(null)
    setNote(null)
  }

  return { expenseCount, pending, note, setNote, accept, restore, reset }
}

/** The question before a replace, or the result, in place of the dialog's normal content. */
function IncomingView({
  incoming,
  onClose,
  onRetry,
  children,
}: {
  incoming: ReturnType<typeof useIncoming>
  onClose: () => void
  onRetry: () => void
  children: ReactNode
}) {
  const { pending, note, expenseCount } = incoming
  if (pending) {
    return (
      <>
        <p>
          The other device has {formatExpenseCount(pending.expenses.length)}. It replaces the{' '}
          {formatExpenseCount(expenseCount)}, the categories and the rate on this device.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11 text-base" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" className="h-11 text-base" onClick={() => void incoming.restore(pending)}>
            Replace data
          </Button>
        </div>
      </>
    )
  }
  if (note) {
    return (
      <NoteView
        note={note}
        action={note.error ? <Button onClick={onRetry}>Try again</Button> : <Button onClick={onClose}>Done</Button>}
      />
    )
  }
  return children
}

function NoteView({ note, action }: { note: Note; action: ReactNode }) {
  return (
    <>
      <p role={note.error ? 'alert' : 'status'} className={note.error ? 'text-destructive' : undefined}>
        {note.text}
      </p>
      <div className="mt-5">{action}</div>
    </>
  )
}

function Waiting({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p role="status" className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      {children}
    </p>
  )
}

function TransferDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader className="px-6 pt-5 pr-14">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pt-4 pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
