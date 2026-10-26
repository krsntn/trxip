import { useSyncExternalStore } from 'react'

/** Tailwind's lg breakpoint. At this width and wider, the app uses the web layout. */
const wide = window.matchMedia('(min-width: 1024px)')

function subscribe(onChange: () => void) {
  wide.addEventListener('change', onChange)
  return () => wide.removeEventListener('change', onChange)
}

/** True when the window is wide enough for the web layout. */
export function useWide(): boolean {
  return useSyncExternalStore(subscribe, () => wide.matches)
}
