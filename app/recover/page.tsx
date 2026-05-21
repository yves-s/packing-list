import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { RecoverHydrator } from './RecoverHydrator'

interface Props {
  searchParams: Promise<{ email?: string; error?: string }>
}

/**
 * Landing page for users coming back from a Magic-Link. Looks up all
 * participants matching the email, then renders a Client Component that
 * hydrates localStorage and redirects to the landing page so the user sees
 * "Deine Touren" populated.
 */
export default async function RecoverPage({ searchParams }: Props) {
  const { email, error } = await searchParams

  if (error) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-16">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Ups.</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/" className="text-sm underline">
            Zurück zur Startseite
          </a>
        </div>
      </main>
    )
  }

  if (!email) redirect('/')

  // Find all participants for this email across all trips.
  const admin = supabaseAdmin()
  const { data: participants } = await admin
    .from('participants')
    .select('id, trip_id, name, avatar_emoji, session_token, trips(join_code, name, date_from, date_to)')
    .ilike('email', email)

  const recovered = (participants ?? [])
    .filter((p) => p.trips !== null)
    .map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = p.trips as any
      return {
        joinCode: t.join_code as string,
        sessionToken: p.session_token,
        tripName: t.name as string,
        myName: p.name,
        myEmoji: p.avatar_emoji,
        dateFrom: t.date_from as string,
        dateTo: t.date_to as string,
      }
    })

  return <RecoverHydrator email={email} trips={recovered} />
}
