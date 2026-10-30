import { useRef } from 'react'
import { CalendarDays } from 'lucide-react'
import type { WeatherResponse } from '../lib/api'
import { fmtWeekday } from '../lib/time'
import { tempColor } from '../lib/sky'
import { fmtTemp, type Preferences } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'
import { Card } from './Card'
import { usePauseOffscreen } from '../hooks/usePauseOffscreen'

export function DailyCard({ w, prefs }: { w: WeatherResponse; prefs: Preferences }) {
  const days = w.daily.slice(0, 10)
  const lo = Math.min(...days.map((d) => d.minC))
  const hi = Math.max(...days.map((d) => d.maxC))
  const span = Math.max(1, hi - lo)
  const pct = (c: number) => ((c - lo) / span) * 100
  const list = useRef<HTMLUListElement>(null)
  usePauseOffscreen(list)

  return (
    <Card icon={<CalendarDays size={13} aria-hidden="true" />} title="10-day forecast">
      <ul ref={list} className="mt-1" data-testid="daily">
        {days.map((d, i) => {
          const left = pct(d.minC)
          const width = Math.max(4, pct(d.maxC) - left)
          const now = i === 0 ? Math.min(100, Math.max(0, pct(w.current.tempC))) : null
          return (
            <li key={d.time} className="grid grid-cols-[3.4rem_2.6rem_2.6rem_1fr_2.6rem] items-center gap-2 border-t border-white/20 py-2.5 first:border-t-0 sm:grid-cols-[4.2rem_3rem_3rem_1fr_3rem]">
              <span className="text-[18px] font-medium">{fmtWeekday(d.time, w.location.utcOffsetSeconds, i)}</span>
              <span className="flex flex-col items-center">
                <WeatherIcon code={d.code} size={22} />
                {d.precipProbMax >= 30 && <span className="text-[11px] font-bold text-[#8fdcff]">{Math.round(d.precipProbMax / 10) * 10}%</span>}
              </span>
              <span className="text-right text-[18px] font-medium text-white/80" aria-label={`Low ${fmtTemp(d.minC, prefs.units)}`}>
                {fmtTemp(d.minC, prefs.units)}
              </span>
              <span className="relative h-[5px] rounded-full bg-black/25" aria-hidden="true">
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{ left: `${left}%`, width: `${width}%`, background: `linear-gradient(90deg, ${tempColor(d.minC)}, ${tempColor(d.maxC)})` }}
                />
                {now !== null && <span className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/30 bg-white" style={{ left: `${now}%` }} data-testid="now-dot" />}
              </span>
              <span className="text-[18px] font-medium" aria-label={`High ${fmtTemp(d.maxC, prefs.units)}`}>
                {fmtTemp(d.maxC, prefs.units)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
