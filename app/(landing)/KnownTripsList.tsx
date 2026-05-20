'use client'
import { useEffect, useState, useTransition } from 'react'
import { forgetTrip, getKnownTrips, type KnownTrip } from '@/lib/trip-memory'
import { enterTrip } from '@/server-actions/trips'
import { toast } from 'sonner'
import { ChevronRight, X } from 'lucide-react'

function formatDateRange(from: string, to: string) {
  try {
    const f = new Date(from)
    const t = new Date(to)
    const month = new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(t)
    return `${f.getDate()}.–${t.getDate()}. ${month}`
  } catch {
    return `${from} – ${to}`
  }
}

export function KnownTripsList() {
  const [trips, setTrips] = useState<KnownTrip[] | null>(null) // null = hydrating
  const [isPending, start] = useTransition()
  const [busyCode, setBusyCode] = useState<string | null>(null)

  useEffect(() => {
    setTrips(getKnownTrips())
  }, [])

  if (trips === null || trips.length === 0) return null

  const enter = (trip: KnownTrip) => {
    setBusyCode(trip.joinCode)
    start(async () => {
      try {
        await enterTrip(trip.joinCode, trip.sessionToken)
        // enterTrip redirects on success; nothing to do here
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        // The Next.js redirect throws a special error that we should NOT
        // treat as a failure. Detect by NEXT_REDIRECT digest pattern.
        if (msg.includes('NEXT_REDIRECT')) return
        if (msg.includes('TRIP_NOT_FOUND') || msg.includes('SESSION_INVALID')) {
          forgetTrip(trip.joinCode)
          setTrips(getKnownTrips())
          toast('Diese Tour ist nicht mehr verfügbar — Eintrag entfernt.')
        } else {
          toast('Konnte Tour nicht öffnen.')
        }
        setBusyCode(null)
      }
    })
  }

  const drop = (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    forgetTrip(code)
    setTrips(getKnownTrips())
  }

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Deine Touren
      </h2>
      <ul className="space-y-1.5">
        {trips.map((trip) => {
          const busy = busyCode === trip.joinCode && isPending
          return (
            <li key={trip.joinCode}>
              <button
                type="button"
                disabled={busy}
                onClick={() => enter(trip)}
                className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted disabled:opacity-50"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-base">
                  {trip.myEmoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-tight">
                    {trip.tripName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    Als {trip.myName} · {formatDateRange(trip.dateFrom, trip.dateTo)}
                  </span>
                </span>
                <span
                  role="button"
                  aria-label="Tour aus dieser Liste entfernen"
                  onClick={(e) => drop(e, trip.joinCode)}
                  className="hidden sm:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
