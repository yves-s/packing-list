'use client'

/**
 * Client-side memory of trips this browser has joined.
 * Stored in localStorage so the landing page can offer one-tap return.
 *
 * Session tokens are stored here intentionally: they ARE this browser's
 * identity for those trips. The server validates each entry when
 * `enterTrip` is called.
 */

const STORAGE_KEY = 'camping_known_trips_v1'

export interface KnownTrip {
  joinCode: string
  sessionToken: string
  tripName: string
  myName: string
  myEmoji: string
  dateFrom: string
  dateTo: string
  joinedAt: string // ISO
  lastVisited: string // ISO
}

function read(): KnownTrip[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is KnownTrip =>
        !!t &&
        typeof t === 'object' &&
        typeof (t as KnownTrip).joinCode === 'string' &&
        typeof (t as KnownTrip).sessionToken === 'string',
    )
  } catch {
    return []
  }
}

function write(trips: KnownTrip[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // Quota / privacy mode — fail silently.
  }
}

export function getKnownTrips(): KnownTrip[] {
  return read().sort((a, b) => (a.lastVisited < b.lastVisited ? 1 : -1))
}

/**
 * Upsert by joinCode. Updates lastVisited to now. Replaces sessionToken if changed
 * (e.g., user re-joined the same trip in this browser after clearing cookies).
 */
export function rememberTrip(
  trip: Omit<KnownTrip, 'joinedAt' | 'lastVisited'>,
): void {
  const now = new Date().toISOString()
  const all = read()
  const existing = all.find((t) => t.joinCode === trip.joinCode)
  const next: KnownTrip = {
    ...trip,
    joinedAt: existing?.joinedAt ?? now,
    lastVisited: now,
  }
  const filtered = all.filter((t) => t.joinCode !== trip.joinCode)
  write([next, ...filtered])
}

export function forgetTrip(joinCode: string): void {
  const all = read()
  write(all.filter((t) => t.joinCode !== joinCode))
}
