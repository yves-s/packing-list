import { notFound } from 'next/navigation'
import { joinTrip } from '@/server-actions/trips'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmojiPicker } from '@/components/EmojiPicker'

function formatDateRange(from: string, to: string) {
  try {
    const f = new Date(from)
    const t = new Date(to)
    const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(t)
    const year = t.getFullYear()
    return `${f.getDate()}.–${t.getDate()}. ${month} ${year}`
  } catch {
    return `${from} – ${to}`
  }
}

export default async function JoinGate({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const { data: trip } = await supabaseAdmin()
    .from('trips')
    .select('name, date_from, date_to, join_code')
    .eq('join_code', code)
    .maybeSingle()
  if (!trip) notFound()

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-10 sm:py-16">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Einladung
        </p>
        <h1 className="text-2xl font-semibold tracking-tight leading-tight">
          {trip.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(trip.date_from, trip.date_to)} ·{' '}
          <span className="font-mono">{trip.join_code}</span>
        </p>
      </header>

      <form action={joinTrip} className="mt-10 space-y-4">
        <input type="hidden" name="code" value={code} />

        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground">
            E-Mail
          </label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="du@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-name" className="text-xs font-medium text-muted-foreground">
            Dein Name
            <span className="ml-1 font-normal text-muted-foreground/70">
              (nur beim ersten Mal nötig)
            </span>
          </label>
          <Input id="invite-name" name="your_name" placeholder="Wie heißt du?" />
        </div>

        <EmojiPicker />

        <Button type="submit" className="w-full">
          Beitreten
        </Button>
      </form>
    </main>
  )
}
