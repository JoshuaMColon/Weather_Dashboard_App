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

/** Cities a first-time visitor (and the /demo guest) starts with: a spread of skies and time zones. */
export const SAMPLE_PLACES: Omit<Place, 'id' | 'sortOrder'>[] = [
  { name: 'New York', lat: 40.7143, lon: -74.006, country: 'United States', admin1: 'New York' },
  { name: 'Cupertino', lat: 37.323, lon: -122.0322, country: 'United States', admin1: 'California' },
  { name: 'London', lat: 51.5085, lon: -0.1257, country: 'United Kingdom', admin1: 'England' },
  { name: 'Tokyo', lat: 35.6895, lon: 139.6917, country: 'Japan', admin1: 'Tokyo' },
  { name: 'Reykjavík', lat: 64.1355, lon: -21.8954, country: 'Iceland', admin1: 'Capital Region' },
]

export const placeSubtitle = (p: Pick<Place, 'admin1' | 'country'>) => [p.admin1, p.country].filter(Boolean).join(', ')
