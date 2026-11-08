/**
 * A saved city. "Already in the list" is lat/lon rounded to 4 decimals (~10 m),
 * the same precision as the numeric(7,4) columns and the upsert conflict key.
 * Names change; the coordinates are the identity.
 */
export interface Place {
  id: string
  name: string
  lat: number
  lon: number
  country: string | null
  admin1: string | null
  sortOrder: number
}

export const round4 = (n: number) => Math.round(n * 10000) / 10000
export const samePlace = (a: Pick<Place, 'lat' | 'lon'>, b: Pick<Place, 'lat' | 'lon'>) =>
  round4(a.lat) === round4(b.lat) && round4(a.lon) === round4(b.lon)

/** Starter cities for a first visit and for /demo. Spread across zones so the list isn't three copies of the same afternoon. */
export const SAMPLE_PLACES: Omit<Place, 'id' | 'sortOrder'>[] = [
  { name: 'New York', lat: 40.7143, lon: -74.006, country: 'United States', admin1: 'New York' },
  { name: 'Cupertino', lat: 37.323, lon: -122.0322, country: 'United States', admin1: 'California' },
  { name: 'London', lat: 51.5085, lon: -0.1257, country: 'United Kingdom', admin1: 'England' },
  { name: 'Tokyo', lat: 35.6895, lon: 139.6917, country: 'Japan', admin1: 'Tokyo' },
  { name: 'Reykjavík', lat: 64.1355, lon: -21.8954, country: 'Iceland', admin1: 'Capital Region' },
]

export const placeSubtitle = (p: Pick<Place, 'admin1' | 'country'>) => [p.admin1, p.country].filter(Boolean).join(', ')
