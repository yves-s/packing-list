'use server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateJoinCode } from '@/lib/codes'
import { SESSION_COOKIE, newSessionToken } from '@/lib/session'
import { CAMPING_TEMPLATE } from '@/lib/templates'

const EMOJI_POOL = ['🏕️', '🌲', '🔥', '🎒', '🌞', '🏔️', '🐻', '🦊', '🌿', '⛺']

function pickEmoji() {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

async function getAppOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host ?? 'localhost:3000'}`
}

function setSessionCookie(jar: Awaited<ReturnType<typeof cookies>>, token: string) {
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
}

/**
 * Sends or generates a Supabase magic link for the given email. The link
 * redirects back to /auth/callback with state in the query string so we
 * know what to do post-verification (enter a specific trip, or recover
 * all trips).
 *
 * Two modes:
 * - DEV (NODE_ENV !== 'production' OR SUPABASE_DEV_MAGIC_LINK=1):
 *   Uses admin.generateLink to produce the URL WITHOUT sending an email.
 *   The URL is printed to the server logs (and returned so the caller can
 *   surface it). Bypasses Supabase's default 2-mails/hour rate limit.
 * - PROD: Uses signInWithOtp which delivers email via Supabase's configured
 *   SMTP (Custom SMTP recommended for production).
 *
 * Returns the generated URL in dev mode; undefined in prod mode.
 */
async function sendMagicLink({
  email,
  redirectPath,
}: {
  email: string
  redirectPath: string
}): Promise<string | undefined> {
  const admin = supabaseAdmin()
  const origin = await getAppOrigin()
  const fullRedirect = `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`

  const isDev = process.env.NODE_ENV !== 'production' || process.env.SUPABASE_DEV_MAGIC_LINK === '1'

  if (isDev) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: fullRedirect },
    })
    if (error || !data?.properties?.action_link) {
      console.error('[sendMagicLink:dev]', error)
      throw new Error('Magic-Link konnte nicht erzeugt werden.')
    }
    const url = data.properties.action_link
    console.log('\n[DEV MAGIC LINK for ' + email + ']\n  ' + url + '\n')
    return url
  }

  const { error } = await admin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: fullRedirect, shouldCreateUser: true },
  })
  if (error) {
    console.error('[sendMagicLink:prod]', error)
    throw new Error('Magic-Link konnte nicht gesendet werden. Versuch es gleich nochmal.')
  }
  return undefined
}

export async function createTrip(formData: FormData): Promise<void> {
  const name = String(formData.get('name') || '').trim()
  const dateFrom = String(formData.get('date_from') || '')
  const dateTo = String(formData.get('date_to') || '')
  const yourName = String(formData.get('your_name') || '').trim()
  const rawEmail = String(formData.get('email') || '').trim()
  const useTemplate = formData.get('use_template') === 'on'

  if (!name || !dateFrom || !dateTo || !yourName || !rawEmail) {
    throw new Error('Bitte alle Felder ausfüllen')
  }
  if (!isValidEmail(rawEmail)) throw new Error('E-Mail sieht komisch aus')
  const email = normalizeEmail(rawEmail)

  const admin = supabaseAdmin()
  // 1) Create trip with NULL created_by
  let joinCode = ''
  for (let i = 0; i < 5; i++) {
    joinCode = generateJoinCode()
    const { error } = await admin.from('trips').insert({
      name,
      date_from: dateFrom,
      date_to: dateTo,
      join_code: joinCode,
    })
    if (!error) break
    if (i === 4) throw new Error('Konnte keinen Join-Code generieren')
  }
  const { data: trip, error: tErr } = await admin
    .from('trips')
    .select('id')
    .eq('join_code', joinCode)
    .single()
  if (tErr || !trip) throw new Error('Trip wurde nicht angelegt')

  // 2) Create first participant
  const sessionToken = newSessionToken()
  const { data: participant, error: pErr } = await admin
    .from('participants')
    .insert({
      trip_id: trip.id,
      name: yourName,
      email,
      avatar_emoji: pickEmoji(),
      session_token: sessionToken,
    })
    .select('id')
    .single()
  if (pErr || !participant) throw new Error('Teilnehmer konnte nicht angelegt werden')

  // 3) Backfill created_by
  await admin.from('trips').update({ created_by: participant.id }).eq('id', trip.id)

  // 4) Optionally seed template
  if (useTemplate) {
    await admin.from('items').insert(
      CAMPING_TEMPLATE.map((t) => ({
        trip_id: trip.id,
        name: t.name,
        category: t.category,
        quantity_needed: t.quantity_needed,
        created_by: participant.id,
      })),
    )
  }

  // 5) Fire magic link (cross-device recovery) — fire-and-forget; user has
  // immediate access via cookie. If email is rate-limited, we swallow it.
  try {
    await sendMagicLink({ email, redirectPath: `/t/${joinCode}` })
  } catch (e) {
    console.warn('[createTrip] magic-link send failed (non-fatal)', e)
  }

  // 6) Set cookie & redirect
  const jar = await cookies()
  setSessionCookie(jar, sessionToken)
  redirect(`/t/${joinCode}`)
}

/**
 * Joins a trip. Two paths, both redirect:
 * - New email for this trip → create participant, set cookie, fire optional
 *   magic link for later cross-device recovery, redirect to /t/CODE.
 * - Email already exists for this trip → DO NOT create a new participant.
 *   Send a magic link to that email and redirect to /inbox-check?email=X&code=Y.
 *   The click in the inbox sets the cookie to the existing identity.
 */
export async function joinTrip(formData: FormData): Promise<void> {
  const code = String(formData.get('code') || '').trim().toUpperCase()
  const yourName = String(formData.get('your_name') || '').trim()
  const rawEmail = String(formData.get('email') || '').trim()
  if (!code || !yourName || !rawEmail) throw new Error('Code, Name und E-Mail sind Pflicht')
  if (!isValidEmail(rawEmail)) throw new Error('E-Mail sieht komisch aus')
  const email = normalizeEmail(rawEmail)

  const admin = supabaseAdmin()
  const { data: trip } = await admin
    .from('trips')
    .select('id')
    .eq('join_code', code)
    .maybeSingle()
  if (!trip) throw new Error('Diesen Code gibt\'s nicht. Schau nochmal.')

  // Check if this email is already in the trip — case-insensitive.
  const { data: existing } = await admin
    .from('participants')
    .select('id')
    .eq('trip_id', trip.id)
    .ilike('email', email)
    .maybeSingle()

  if (existing) {
    // Don't trust the cookie — require a magic-link click to re-enter
    // this identity. Prevents trivial spoofing.
    const devLink = await sendMagicLink({ email, redirectPath: `/t/${code}` })
    // In dev, auto-follow the link so the developer doesn't have to dig
    // through logs or wait for emails.
    if (devLink) redirect(devLink)
    redirect(`/inbox-check?email=${encodeURIComponent(email)}&code=${code}`)
  }

  // New email for this trip → create participant.
  const sessionToken = newSessionToken()
  await admin.from('participants').insert({
    trip_id: trip.id,
    name: yourName,
    email,
    avatar_emoji: pickEmoji(),
    session_token: sessionToken,
  })

  // Fire magic link in background for future cross-device recovery.
  try {
    await sendMagicLink({ email, redirectPath: `/t/${code}` })
  } catch (e) {
    console.warn('[joinTrip] magic-link send failed (non-fatal)', e)
  }

  const jar = await cookies()
  setSessionCookie(jar, sessionToken)
  redirect(`/t/${code}`)
}

/**
 * Triggered from the landing "Schon dabei?"-Form. Sends a Magic-Link to
 * the email; clicking it lands the user on /recover with the email in the
 * query string, where their trips are hydrated into localStorage.
 */
export async function requestRecovery(formData: FormData): Promise<void> {
  const rawEmail = String(formData.get('email') || '').trim()
  if (!isValidEmail(rawEmail)) throw new Error('E-Mail sieht komisch aus')
  const email = normalizeEmail(rawEmail)

  const devLink = await sendMagicLink({ email, redirectPath: '/recover' })
  if (devLink) redirect(devLink)
  redirect(`/inbox-check?email=${encodeURIComponent(email)}`)
}

/**
 * Switch the active session cookie to one this browser already owns (from
 * localStorage). Validates that the session_token belongs to a participant
 * of the given trip — so a client can't forge entry into a trip they
 * haven't joined.
 */
export async function enterTrip(joinCode: string, sessionToken: string): Promise<void> {
  const code = String(joinCode || '').trim().toUpperCase()
  const token = String(sessionToken || '').trim()
  if (!code || !token) throw new Error('Code und Session fehlen')

  const admin = supabaseAdmin()
  const { data: trip } = await admin
    .from('trips')
    .select('id')
    .eq('join_code', code)
    .maybeSingle()
  if (!trip) throw new Error('TRIP_NOT_FOUND')

  const { data: participant } = await admin
    .from('participants')
    .select('id')
    .eq('session_token', token)
    .eq('trip_id', trip.id)
    .maybeSingle()
  if (!participant) throw new Error('SESSION_INVALID')

  const jar = await cookies()
  setSessionCookie(jar, token)
  redirect(`/t/${code}`)
}
