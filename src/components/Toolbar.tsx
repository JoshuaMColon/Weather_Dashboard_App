import { List, Navigation, UserRound } from 'lucide-react'

export function Toolbar({ count, index, hasHere, onDot, onList, onAccount }: { count: number; index: number; hasHere: boolean; onDot: (i: number) => void; onList: () => void; onAccount: () => void }) {
  return (
    <div className="glass-bar fixed inset-x-0 bottom-0 z-20 flex items-center justify-between px-4 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden">
      <button type="button" onClick={onAccount} className="press grid h-11 w-11 place-items-center rounded-full" aria-label="Account and settings" data-testid="account-button">
        <UserRound size={22} aria-hidden="true" />
      </button>
      <div className="flex min-w-0 items-center overflow-hidden" role="tablist" aria-label="Cities">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`City ${i + 1} of ${count}`} onClick={() => onDot(i)} className={`press grid h-6 place-items-center ${count <= 10 ? 'w-6' : 'w-4'}`}>
            {i === 0 && hasHere ? (
              <Navigation size={9} className={i === index ? 'fill-white text-white' : 'fill-white/45 text-white/45'} aria-hidden="true" />
            ) : (
              <span className={`block h-[7px] w-[7px] rounded-full ${i === index ? 'bg-white' : 'bg-white/45'}`} />
            )}
          </button>
        ))}
      </div>
      <button type="button" onClick={onList} className="press grid h-11 w-11 place-items-center rounded-full" aria-label="Show city list" data-testid="list-button">
        <List size={24} aria-hidden="true" />
      </button>
    </div>
  )
}
