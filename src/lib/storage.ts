/**
 * localStorage that doesn't throw. Private mode and a full quota degrade to
 * whatever the caller is already holding in memory. A missing or corrupt
 * value comes back as the fallback.
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or private mode. The in-memory copy is enough for this session.
  }
}
