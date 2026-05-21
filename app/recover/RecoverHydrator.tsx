'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { rememberTrip } from '@/lib/trip-memory'
import { CheckCircle2 } from 'lucide-react'

interface RecoveredTrip {
  joinCode: string
  sessionToken: string
  tripName: string
  myName: string
  myEmoji: string
  dateFrom: string
  dateTo: string
}

export function RecoverHydrator({
  email,
  trips,
}: {
  email: string
  trips: RecoveredTrip[]
}) {
  const router = useRouter()

  useEffect(() => {
    for (const t of trips) rememberTrip(t)
    // Give the user a beat to see the success, then redirect.
    const id = setTimeout(() => router.push('/'), 1400)
    return () => clearTimeout(id)
  }, [router, trips])

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-16 sm:py-24">
      <div className="space-y-6">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">
            Willkommen zurück
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {trips.length === 0 ? (
              <>
                Für <span className="font-medium text-foreground">{email}</span> haben wir keine Touren gefunden. Du landest gleich wieder auf der Startseite.
              </>
            ) : (
              <>
                Wir haben{' '}
                <span className="font-medium text-foreground">
                  {trips.length === 1 ? '1 Tour' : `${trips.length} Touren`}
                </span>{' '}
                für <span className="font-medium text-foreground">{email}</span> gefunden. Du landest gleich auf der Startseite.
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  )
}
