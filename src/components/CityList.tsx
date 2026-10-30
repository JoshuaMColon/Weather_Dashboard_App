import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Cloud, CloudOff, MinusCircle, Navigation, RefreshCw, UserRound, X } from 'lucide-react'
import { useWeather } from '../hooks/useWeather'
import type { GeocodeResult } from '../lib/api'
import type { Place } from '../lib/places'
import { skyGradient, skyState } from '../lib/sky'
import { codeInfo } from '../lib/weatherCodes'
import { fmtClock, nowUnix } from '../lib/time'
import { fmtTemp, type Preferences } from '../lib/units'
import { SearchBox } from './SearchBox'
import { WeatherIcon } from './WeatherIcon'
import { usePauseOffscreen } from '../hooks/usePauseOffscreen'

interface Props {
  here: Place | null
  places: Place[]
  selectedId: string | null
  prefs: Preferences
  sync: string
  accountLabel: string
  onSelect: (id: string) => void
  onPick: (r: GeocodeResult) => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onLocate: () => void
  locating: boolean
  locateStatus: string
  onAccount: () => void
  onClose?: () => void
}

export function CityList(p: Props) {
  const [editing, setEditing] = useState(false)
  const [searching, setSearching] = useState(false)
  const all = p.here ? [p.here, ...p.places] : p.places
  const list = useRef<HTMLUListElement>(null)
  usePauseOffscreen(list)

  return (
    <nav aria-label="Saved cities" className="flex h-full flex-col" data-testid="city-list">
      <div className="flex items-center justify-between px-4 pt-3">
        <button type="button" onClick={p.onAccount} className="press flex items-center gap-1.5 rounded-full px-1 py-1 text-[15px] text-white/90" data-testid="account-button-list">
          <UserRound size={18} aria-hidden="true" />
          <span className="max-w-[12rem] truncate">{p.accountLabel}</span>
          <SyncBadge sync={p.sync} />
        </button>
        <div className="flex items-center gap-2">
          {p.places.length > 0 && (
            <button type="button" onClick={() => setEditing((e) => !e)} className="press rounded-full px-3 py-1 text-[15px] font-semibold" aria-pressed={editing}>
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
          {p.onClose && (
            <button type="button" onClick={p.onClose} className="press grid h-8 w-8 place-items-center rounded-full bg-white/15" aria-label="Close city list" data-testid="close-list">
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <h1 className="px-4 pt-1 pb-2 text-[34px] font-bold tracking-tight">Weather</h1>
      <div className="px-4 pb-3">
        <SearchBox onPick={p.onPick} onLocate={p.onLocate} locating={p.locating} locateStatus={p.locateStatus} onActiveChange={setSearching} />
      </div>
      {!searching && (
        <ul ref={list} className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 pb-6">
          {all.map((place, i) => (
            <li key={place.id} className="flex items-center gap-2">
              {editing && place.id !== 'here' && (
                <button type="button" onClick={() => p.onRemove(place.id)} className="press shrink-0 text-[#ff6b5f]" aria-label={`Remove ${place.name}`}>
                  <MinusCircle size={24} className="fill-[#ff453a] text-white" aria-hidden="true" />
                </button>
              )}
              <MiniCard place={place} prefs={p.prefs} selected={place.id === p.selectedId} onClick={() => p.onSelect(place.id)} />
              {editing && place.id !== 'here' && (
                <span className="flex shrink-0 flex-col">
                  <button type="button" className="press p-1 disabled:opacity-30" disabled={i === (p.here ? 1 : 0)} onClick={() => p.onMove(place.id, -1)} aria-label={`Move ${place.name} up`}>
                    <ChevronUp size={20} aria-hidden="true" />
                  </button>
                  <button type="button" className="press p-1 disabled:opacity-30" disabled={i === all.length - 1} onClick={() => p.onMove(place.id, 1)} aria-label={`Move ${place.name} down`}>
                    <ChevronDown size={20} aria-hidden="true" />
                  </button>
                </span>
              )}
            </li>
          ))}
          {!all.length && <li className="py-8 text-center text-white/80">Search for a city to add it here.</li>}
        </ul>
      )}
    </nav>
  )
}

function SyncBadge({ sync }: { sync: string }) {
  if (sync === 'synced') return <Cloud size={14} className="text-[#7fd3ff]" aria-label="Synced" />
  if (sync === 'syncing') return <RefreshCw size={13} className="animate-spin" aria-label="Syncing" />
  if (sync === 'error') return <CloudOff size={14} className="text-[#ffb3a8]" aria-label="Sync error" />
  return null
}

function MiniCard({ place, prefs, selected, onClick }: { place: Place; prefs: Preferences; selected: boolean; onClick: () => void }) {
  const { data } = useWeather(place.lat, place.lon)
  const sky = data ? skyState(data) : null
  const bg = sky ? skyGradient(sky, prefs.theme) : 'linear-gradient(180deg,#2b3a50,#3c4c63)'
  const today = data?.daily[0]
  const isHere = place.id === 'here'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={`press relative flex h-[104px] min-w-0 flex-1 overflow-hidden rounded-[18px] px-4 py-2.5 text-left shadow-lg ring-white/80 transition ${selected ? 'ring-2' : ''}`}
      style={{ background: bg }}
      data-testid="mini-card"
    >
      <span className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <span className="text-shadow relative flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 truncate text-[20px] leading-tight font-bold">
          {isHere ? 'My Location' : place.name}
          {isHere && <Navigation size={12} className="fill-white" aria-hidden="true" />}
        </span>
        <span className="truncate text-[14px] font-medium">{isHere ? place.name : data ? fmtClock(nowUnix(), data.location.utcOffsetSeconds) : ''}</span>
        <span className="mt-auto flex min-w-0 items-center gap-1.5 text-[14px] font-medium">
          {data && <WeatherIcon code={data.current.code} isDay={data.current.isDay} size={18} className="shrink-0" />}
          <span className="truncate">{data ? codeInfo(data.current.code).label : 'Loading…'}</span>
        </span>
      </span>
      <span className="text-shadow relative flex shrink-0 flex-col items-end">
        <span className="text-[44px] leading-none font-light">{data ? fmtTemp(data.current.tempC, prefs.units) : '--'}</span>
        {today && (
          <span className="mt-auto text-[14px] font-medium">
            H:{fmtTemp(today.maxC, prefs.units)}&nbsp; L:{fmtTemp(today.minC, prefs.units)}
          </span>
        )}
      </span>
    </button>
  )
}
