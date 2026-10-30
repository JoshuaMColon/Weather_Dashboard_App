import { useRef } from 'react'
import { Clock, Sunrise, Sunset } from 'lucide-react'
import type { WeatherResponse } from '../lib/api'
import { hourlySummary } from '../lib/insights'
import { fmtClock, fmtHour } from '../lib/time'
import { fmtTemp, type Preferences } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'
import { Card } from './Card'
import { usePauseOffscreen } from '../hooks/usePauseOffscreen'

type Item =
  | { type: 'hour'; time: number; label: string; code: number; isDay: boolean; tempC: number; precipProb: number }
  | { type: 'sun'; time: number; label: string; event: 'Sunrise' | 'Sunset' }

export function HourlyCard({ w, prefs }: { w: WeatherResponse; prefs: Preferences }) {
  const off = w.location.utcOffsetSeconds
  const hours = w.hourly.slice(0, 25)
  const start = hours[0]?.time ?? 0
  const end = hours[hours.length - 1]?.time ?? 0
  const items: Item[] = hours.map((h, i) => ({
    type: 'hour',
    time: h.time,
    label: i === 0 ? 'Now' : fmtHour(h.time, off),
    code: i === 0 ? w.current.code : h.code,
    isDay: i === 0 ? w.current.isDay : h.isDay,
    tempC: i === 0 ? w.current.tempC : h.tempC,
    precipProb: h.precipProb,
  }))
  for (const d of w.daily.slice(0, 2)) {
    for (const [event, t] of [['Sunrise', d.sunrise], ['Sunset', d.sunset]] as const) {
      if (t > start && t < end) items.push({ type: 'sun', time: t, label: fmtClock(t, off), event })
    }
  }
  items.sort((a, b) => a.time - b.time)
  const list = useRef<HTMLOListElement>(null)
  usePauseOffscreen(list)

  return (
    <Card icon={<Clock size={13} aria-hidden="true" />} title="Hourly forecast" className="!px-0">
      <p className="mx-4 mt-2 border-b border-white/20 pb-2.5 text-[15px] leading-snug" data-testid="hourly-summary">
        {hourlySummary(w, prefs)}
      </p>
      <ol ref={list} className="no-scrollbar mt-1 flex snap-x overflow-x-auto rounded-lg px-2 pb-1" aria-label="Next 24 hours" tabIndex={0} data-testid="hourly">
        {items.map((it) => (
          <li key={`${it.type}-${it.time}`} className="flex w-[58px] shrink-0 snap-start flex-col items-center gap-2 py-2 text-center">
            <span className="text-[14px] font-semibold whitespace-nowrap">{it.type === 'sun' ? it.label.replace(' ', '') : it.label}</span>
            <span className="flex h-9 flex-col items-center justify-center">
              {it.type === 'sun' ? (
                it.event === 'Sunrise' ? <Sunrise size={24} className="text-[#ffd84a]" aria-hidden="true" /> : <Sunset size={24} className="text-[#ffb057]" aria-hidden="true" />
              ) : (
                <>
                  <WeatherIcon code={it.code} isDay={it.isDay} size={24} />
                  {it.precipProb >= 20 && <span className="text-[11px] font-bold text-[#8fdcff]">{Math.round(it.precipProb / 10) * 10}%</span>}
                </>
              )}
            </span>
            <span className="text-[18px] font-medium">{it.type === 'sun' ? it.event : fmtTemp(it.tempC, prefs.units)}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
