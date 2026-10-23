import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { CurrencyCode } from '@/domain/types'
import { cn } from '@/lib/utils'
import { controlClass } from './Field'

// Same picker as the exch project: a list of common travel currencies that also accepts typing.
// Any other 3-letter code can still be typed.
const CODES = 'AED AUD BND CAD CHF CNY EUR GBP HKD IDR INR JPY KRW MYR NZD PHP SAR SGD THB TWD USD VND'.split(' ')

// Names come from the browser (Intl), so there is no name list to maintain.
const names = new Intl.DisplayNames(['en'], { type: 'currency' })
const nameOf = (code: string) => {
  const name = names.of(code)
  return name && name !== code ? name : ''
}

interface Option {
  code: CurrencyCode
  name: string
}

const CURRENCIES: Option[] = CODES.map((code) => ({ code, name: nameOf(code) }))

function normalize(text: string): string {
  return text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
}

/** Codes that start with the text come first, then currencies whose name contains it. */
function optionsFor(text: string): Option[] {
  if (!text) return CURRENCIES
  const lower = text.toLowerCase()
  const byCode = CURRENCIES.filter((c) => c.code.startsWith(text))
  const byName = CURRENCIES.filter((c) => !c.code.startsWith(text) && c.name.toLowerCase().includes(lower))
  const found = [...byCode, ...byName]
  // A full code that matches nothing becomes its own option, so it can be tapped like any other.
  return text.length === 3 && found.length === 0 ? [{ code: text, name: 'Use this code' }] : found
}

export function CurrencyPicker({
  id,
  value,
  onChange,
  disabled,
  foreign = false,
}: {
  id: string
  value: CurrencyCode
  onChange: (code: CurrencyCode) => void
  disabled?: boolean
  /** Shows the code in the foreign-currency colour. */
  foreign?: boolean
}) {
  const listId = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  // The blur handler reads the draft before React re-renders, so it lives in a ref too.
  const draftRef = useRef('')
  const [draft, setDraftState] = useState('')
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(true)
  const [active, setActive] = useState(-1)
  const [alignRight, setAlignRight] = useState(false)

  const options = optionsFor(showAll ? '' : normalize(draft))
  const optionId = (i: number) => `${listId}-${i}`

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  function setDraft(text: string) {
    draftRef.current = text
    setDraftState(text)
  }

  // all: true when the list opens from a tap or the arrow, so every currency shows.
  function openList(all: boolean, text: string) {
    const typed = all ? '' : normalize(text)
    const list = optionsFor(typed)
    const match = list.findIndex((c) => c.code === (normalize(text) || value))
    setShowAll(all)
    setActive(match >= 0 ? match : typed && list.length ? 0 : -1)
    // A field in the right half opens its list to the left, so the list stays on screen.
    setAlignRight((wrap.current?.getBoundingClientRect().left ?? 0) > window.innerWidth / 2)
    setOpen(true)
  }

  function choose(code: CurrencyCode) {
    setDraft(code)
    input.current?.blur() // The blur handler saves the code. On a phone this also hides the keyboard.
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList(true, '')
      if (!options.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(Math.max(0, Math.min(options.length - 1, active + step)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0) choose(options[active].code)
      else input.current?.blur()
    } else if (e.key === 'Escape') {
      setDraft('')
      input.current?.blur() // The old code comes back.
    }
  }

  return (
    <div ref={wrap} className="relative">
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        maxLength={3}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled}
        // The field empties on focus, so typing never hits the 3-letter limit. The old code shows as the placeholder.
        value={focused ? draft : value}
        placeholder={focused ? value : 'Choose'}
        onFocus={() => {
          setFocused(true)
          setDraft('')
          openList(true, '')
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          openList(false, e.target.value)
        }}
        onBlur={() => {
          // Leaving the field without a full code keeps the old code.
          const code = normalize(draftRef.current)
          if (code.length === 3 && code !== value) onChange(code)
          setFocused(false)
          setOpen(false)
        }}
        onKeyDown={onKeyDown}
        className={cn(
          controlClass,
          'figures pr-10 text-lg font-semibold uppercase placeholder:font-normal placeholder:normal-case',
          foreign && 'text-foreign',
        )}
      />
      {!disabled && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Show all currencies"
          // Keep focus in the input, so blur does not close the list first.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (open ? input.current?.blur() : input.current?.focus())}
          className="absolute inset-y-0 right-1 grid w-9 place-items-center text-muted-foreground"
        >
          <ChevronDown className="size-4" />
        </button>
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            'absolute top-[calc(100%+4px)] z-30 max-h-[280px] w-max max-w-[min(320px,calc(100vw-32px))] min-w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
            alignRight ? 'right-0' : 'left-0',
          )}
        >
          {options.length === 0 && <li className="px-2.5 py-2 text-muted-foreground">No currency found</li>}
          {options.map((c, i) => (
            <li
              key={c.code}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onClick={() => choose(c.code)}
              className={cn(
                'flex cursor-pointer gap-2.5 rounded-md px-2.5 py-2 hover:bg-background',
                i === active && 'bg-background',
              )}
            >
              <span className="figures w-[3.2em] shrink-0 font-semibold">{c.code}</span>
              <span className="truncate text-muted-foreground">{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
