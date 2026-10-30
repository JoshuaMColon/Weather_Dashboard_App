import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun, type LucideProps } from 'lucide-react'
import { codeInfo } from '../lib/weatherCodes'

/** Multicolour-ish icons in the spirit of SF Symbols: yellow sun, white cloud, cyan rain. */
export function WeatherIcon({ code, isDay = true, size = 24, className = '' }: { code: number; isDay?: boolean; size?: number; className?: string }) {
  const kind = codeInfo(code).kind
  const p: LucideProps = { size, strokeWidth: 1.8, 'aria-hidden': true, className }
  switch (kind) {
    case 'clear':
      return isDay ? <Sun {...p} className={`text-[#ffd84a] fill-[#ffd84a] ${className}`} /> : <Moon {...p} className={`text-white fill-white/90 ${className}`} />
    case 'partly':
      return isDay ? <CloudSun {...p} className={`text-white ${className}`} /> : <CloudMoon {...p} className={`text-white ${className}`} />
    case 'cloudy':
      return <Cloud {...p} className={`text-white fill-white/80 ${className}`} />
    case 'fog':
      return <CloudFog {...p} className={`text-white ${className}`} />
    case 'drizzle':
      return <CloudDrizzle {...p} className={`text-[#7fd3ff] ${className}`} />
    case 'rain':
      return <CloudRain {...p} className={`text-[#7fd3ff] ${className}`} />
    case 'snow':
      return <CloudSnow {...p} className={`text-white ${className}`} />
    case 'storm':
      return <CloudLightning {...p} className={`text-[#ffd84a] ${className}`} />
  }
}
