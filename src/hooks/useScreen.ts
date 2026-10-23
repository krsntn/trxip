import { useSyncExternalStore } from 'react'

export type Screen = 'expenses' | 'summary' | 'config'

function readScreen(): Screen {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return hash === 'summary' || hash === 'config' ? hash : 'expenses'
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** The current screen, from the URL hash (#/summary, #/config). */
export function useScreen(): Screen {
  return useSyncExternalStore(subscribe, readScreen)
}
