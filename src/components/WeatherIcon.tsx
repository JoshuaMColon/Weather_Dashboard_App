import { codeInfo } from '../lib/weatherCodes'

/**
 * Animated weather icons, hand-built SVG + CSS keyframes (see `.wxi` in
 * index.css). Only transform/opacity animate; under prefers-reduced-motion the
 * animations are removed and the static drawing remains. Colours follow SF
 * Symbols multicolour: yellow sun, white cloud, cyan rain.
 */
const SUN = '#ffd84a'
const RAIN = '#7fd3ff'

function CloudShape({ fill = '#fff', className = '', transform }: { fill?: string; className?: string; transform?: string }) {
  return (
    <g transform={transform}>
      <g className={className} fill={fill}>
        <circle cx="11" cy="19" r="5.5" />
        <circle cx="17.5" cy="15" r="7" />
        <circle cx="23.5" cy="19.5" r="5" />
        <rect x="6" y="19" width="22" height="6.5" rx="3.25" />
      </g>
    </g>
  )
}

function SunShape({ cx, cy, r, rays = true }: { cx: number; cy: number; r: number; rays?: boolean }) {
  return (
    <g>
      {rays && (
        <g className="wxi-spin" stroke={SUN} strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4
            const r1 = r + 2.4
            const r2 = r + 4.8
            return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2} />
          })}
        </g>
      )}
      <circle className="wxi-pulse" cx={cx} cy={cy} r={r} fill={SUN} />
    </g>
  )
}

function MoonShape({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <path className="wxi-rock" d="M19.5 5.5a10 10 0 1 0 7.2 15.6A8.2 8.2 0 0 1 19.5 5.5z" fill="#f4f1e6" />
    </g>
  )
}

function Drops({ color = RAIN, n = 3, short = false }: { color?: string; n?: number; short?: boolean }) {
  const xs = n === 3 ? [11, 16.5, 22] : [12, 20]
  return (
    <g stroke={color} strokeWidth="2" strokeLinecap="round">
      {xs.map((x, i) => (
        <line key={x} className="wxi-drop" style={{ animationDelay: `${i * -0.37}s` }} x1={x} y1="24" x2={x - 1.2} y2={short ? 26.5 : 28} />
      ))}
    </g>
  )
}

export function WeatherIcon({ code, isDay = true, size = 24, className = '' }: { code: number; isDay?: boolean; size?: number; className?: string }) {
  const kind = codeInfo(code).kind
  let body: React.ReactNode
  switch (kind) {
    case 'clear':
      body = isDay ? (
        <SunShape cx={16} cy={16} r={6} />
      ) : (
        <>
          <MoonShape />
          <circle className="wxi-twinkle" cx="26" cy="7" r="1.1" fill="#fff" />
          <circle className="wxi-twinkle" style={{ animationDelay: '-1s' }} cx="29" cy="13" r="0.8" fill="#fff" />
        </>
      )
      break
    case 'partly':
      body = (
        <>
          {isDay ? <SunShape cx={11} cy={10.5} r={4.6} /> : <MoonShape transform="translate(-6 -3) scale(0.8)" />}
          <CloudShape className="wxi-float" transform="translate(3 3) scale(0.9)" />
        </>
      )
      break
    case 'cloudy':
      body = (
        <>
          <CloudShape fill="#c9d2de" className="wxi-float-slow" transform="translate(5 -5) scale(0.75)" />
          <CloudShape className="wxi-float" transform="translate(0 2)" />
        </>
      )
      break
    case 'fog':
      body = (
        <>
          <CloudShape className="wxi-float" transform="translate(0 -5)" />
          <g stroke="#e6ebf2" strokeWidth="2" strokeLinecap="round">
            <line className="wxi-fog" x1="6" y1="25" x2="22" y2="25" />
            <line className="wxi-fog" style={{ animationDelay: '-1.6s' }} x1="10" y1="29" x2="27" y2="29" />
          </g>
        </>
      )
      break
    case 'drizzle':
    case 'rain':
      body = (
        <>
          <CloudShape className="wxi-float" transform="translate(0 -5)" />
          <Drops n={kind === 'drizzle' ? 2 : 3} short={kind === 'drizzle'} />
        </>
      )
      break
    case 'snow':
      body = (
        <>
          <CloudShape className="wxi-float" transform="translate(0 -5)" />
          <g fill="#fff">
            {[11, 17, 23].map((x, i) => (
              <circle key={x} className="wxi-flake" style={{ animationDelay: `${i * -0.8}s` }} cx={x} cy={25.5} r="1.6" />
            ))}
          </g>
        </>
      )
      break
    case 'storm':
      body = (
        <>
          <CloudShape fill="#d6dbe4" className="wxi-float" transform="translate(0 -5)" />
          <path className="wxi-bolt" d="M17.5 19.5 13 26.2h3.6l-1.8 5.3 5.6-7.6h-3.7l2-4.4z" fill={SUN} />
          <g stroke={RAIN} strokeWidth="1.8" strokeLinecap="round">
            <line className="wxi-drop" x1="10" y1="22" x2="9" y2="25.5" />
            <line className="wxi-drop" style={{ animationDelay: '-0.55s' }} x1="25" y1="22" x2="24" y2="25.5" />
          </g>
        </>
      )
      break
  }
  return (
    <svg className={`wxi ${className}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" data-kind={kind}>
      {body}
    </svg>
  )
}
