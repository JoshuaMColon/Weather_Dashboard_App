/** Formatting in the *location's* local time: unix seconds + the location's UTC offset. */
const shifted = (t: number, offset: number) => new Date((t + offset) * 1000)

export function fmtHour(t: number, offset: number): string {
  const h = shifted(t, offset).getUTCHours()
  return `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`
}

export function fmtClock(t: number, offset: number): string {
  const d = shifted(t, offset)
  const h = d.getUTCHours()
  return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function fmtWeekday(t: number, offset: number, index: number): string {
  return index === 0 ? 'Today' : DAYS[shifted(t, offset).getUTCDay()]
}

export const nowUnix = () => Math.floor(Date.now() / 1000)
