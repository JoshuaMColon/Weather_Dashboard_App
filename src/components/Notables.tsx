import { AlertTriangle, CloudRain, Info } from 'lucide-react'
import type { Notable } from '../lib/insights'

export function Notables({ items }: { items: Notable[] }) {
  if (!items.length) return null
  return (
    <div className="space-y-3" data-testid="notables">
      {items.map((n) => (
        <section
          key={n.title}
          role={n.level === 'warning' ? 'alert' : 'status'}
          className={`glass rounded-[22px] px-4 py-3 ${n.level === 'warning' ? 'ring-1 ring-[#ffb340]/50' : ''}`}
        >
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-white/80">
            {n.level === 'warning' ? <AlertTriangle size={14} className="text-[#ffc25a]" aria-hidden="true" /> : n.level === 'watch' ? <CloudRain size={14} aria-hidden="true" /> : <Info size={14} aria-hidden="true" />}
            Notable change
          </h2>
          <p className="mt-1.5 text-[17px] font-semibold">{n.title}</p>
          <p className="text-[15px] text-white/90">{n.detail}</p>
        </section>
      ))}
    </div>
  )
}
