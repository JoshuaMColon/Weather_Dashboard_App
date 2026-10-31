import { useEffect, useId, useRef, useState } from 'react'
import { LocateFixed, Loader2, Search, X } from 'lucide-react'
import { searchPlaces, type GeocodeResult } from '../lib/api'
import { placeSubtitle } from '../lib/places'

interface Props {
  onPick: (r: GeocodeResult) => void
  onLocate: () => void
  locating: boolean
  locateStatus: string
  onActiveChange?: (active: boolean) => void
}

/** Debounced geocoding autocomplete as an ARIA combobox. */
export function SearchBox({ onPick, onLocate, locating, locateStatus, onActiveChange }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [active, setActive] = useState(-1)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const query = q.trim()

  useEffect(() => {
    onActiveChange?.(query.length > 0)
  }, [query, onActiveChange])

  useEffect(() => {
    if (query.length < 2) return
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      setStatus('loading')
      searchPlaces(query, ctrl.signal)
        .then((r) => {
          setResults(r)
          setActive(-1)
          setStatus('done')
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== 'AbortError') setStatus('error')
        })
    }, 250)
    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [query])

  const show = query.length >= 2
  const pick = (r: GeocodeResult) => {
    onPick(r)
    setQ('')
    setResults([])
    setStatus('idle')
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-white/15 px-3 focus-within:ring-2 focus-within:ring-white/70">
          <Search size={17} className="shrink-0 text-white/80" aria-hidden="true" />
          <span className="sr-only">Search for a city or airport</span>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={show}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(results.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(-1, a - 1))
              } else if (e.key === 'Enter' && results.length) {
                e.preventDefault()
                pick(results[Math.max(0, active)])
              } else if (e.key === 'Escape') setQ('')
            }}
            placeholder="Search for a city"
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-white placeholder:text-white/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            data-testid="search-input"
          />
          {status === 'loading' && show && <Loader2 size={16} className="animate-spin text-white/80" aria-hidden="true" />}
          {q && (
            <button type="button" onClick={() => setQ('')} className="press -mr-1 rounded-full p-1" aria-label="Clear search">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={onLocate}
          className="press grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"
          aria-label="Use my location"
          data-testid="locate"
        >
          {locating ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <LocateFixed size={18} aria-hidden="true" />}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {show && status === 'done' ? `${results.length} results` : ''}
        {locateStatus === 'denied' ? 'Location permission was denied.' : locateStatus === 'error' ? 'Your location could not be found.' : ''}
      </p>
      {(locateStatus === 'denied' || locateStatus === 'error') && (
        <p className="mt-2 text-[13px] text-[#ffc9b5]">{locateStatus === 'denied' ? 'Location access is off. Allow it in your browser to see local weather.' : 'Your location could not be found.'}</p>
      )}
      {show && (
        <ul id={listId} role="listbox" aria-label="Search results" className="mt-3 overflow-hidden rounded-xl bg-white/10" data-testid="search-results">
          {status === 'done' && !results.length && <li className="px-4 py-3 text-white/80">No results for "{query}"</li>}
          {status === 'error' && <li className="px-4 py-3 text-white/80">Search is unavailable. Try again.</li>}
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r)}
              className={`press cursor-pointer border-t border-white/10 px-4 py-2.5 first:border-t-0 ${i === active ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <span className="block text-[17px]">{r.name}</span>
              <span className="block text-[13px] text-white/80">{placeSubtitle(r)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
