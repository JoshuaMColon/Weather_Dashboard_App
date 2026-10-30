import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

export const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
