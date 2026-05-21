import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SESSION_COOKIE } from '@/lib/session'
import type { Database } from '@/lib/database.types'

/**
 * Magic-link callback. Supabase sends users here with either a code
 * (`?code=...`) or a token_hash (`?token_hash=...&type=...`).
 *
 * After exchanging the code for a session we know the user's email.
 * - For trip-join links (`?next=/t/CODE`): find or create the participant
 *   with this email in that trip, set the session cookie, redirect into
 *   the trip.
 * - For recovery links (`?next=/recover`): redirect to /recover with
 *   `?email=...` so the page can render the matching trips.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const next = url.searchParams.get('next') ?? '/'

  const jar = await cookies()

  const supa = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => jar.set(name, value, options)),
      },
    },
  )

  // PKCE flow uses ?code=; OTP flow uses ?token_hash=
  let userEmail: string | null = null

  if (code) {
    const { data, error } = await supa.auth.exchangeCodeForSession(code)
    if (error) return redirectWithError(req, 'Magic-Link ungültig oder abgelaufen.')
    userEmail = data.user?.email ?? null
  } else if (tokenHash && type) {
    // type is 'magiclink' | 'email' | 'recovery' etc. — accept all.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supa.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
    if (error) return redirectWithError(req, 'Magic-Link ungültig oder abgelaufen.')
    userEmail = data.user?.email ?? null
  } else {
    return redirectWithError(req, 'Magic-Link unvollständig.')
  }

  if (!userEmail) return redirectWithError(req, 'E-Mail konnte nicht ermittelt werden.')

  // Trip-Join path: next looks like /t/CODE
  const tripMatch = next.match(/^\/t\/([A-Z2-9]{6})$/)
  if (tripMatch) {
    const joinCode = tripMatch[1]
    await handleTripEntry({ email: userEmail, joinCode, jar })
    return NextResponse.redirect(new URL(`/t/${joinCode}`, req.url))
  }

  // Recovery path
  if (next === '/recover') {
    const dest = new URL('/recover', req.url)
    dest.searchParams.set('email', userEmail)
    return NextResponse.redirect(dest)
  }

  return NextResponse.redirect(new URL(next, req.url))
}

async function handleTripEntry({
  email,
  joinCode,
  jar,
}: {
  email: string
  joinCode: string
  jar: Awaited<ReturnType<typeof cookies>>
}) {
  const admin = supabaseAdmin()
  const { data: trip } = await admin
    .from('trips')
    .select('id')
    .eq('join_code', joinCode)
    .maybeSingle()
  if (!trip) return

  const { data: participant } = await admin
    .from('participants')
    .select('session_token')
    .eq('trip_id', trip.id)
    .ilike('email', email)
    .maybeSingle()

  if (!participant) return

  jar.set(SESSION_COOKIE, participant.session_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
}

function redirectWithError(req: NextRequest, message: string) {
  const u = new URL('/recover', req.url)
  u.searchParams.set('error', message)
  return NextResponse.redirect(u)
}
