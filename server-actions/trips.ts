'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateJoinCode } from '@/lib/codes'
import { SESSION_COOKIE, newSessionToken } from '@/lib/session'
import { CAMPING_TEMPLATE } from '@/lib/templates'

const EMOJI_POOL = ['🏕️', '🌲', '🔥', '🎒', '🌞', '🏔️', '🐻', '🦊', '🌿', '⛺']

function pickEmoji() {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]
}

export async function createTrip(formData: FormData): Promise<void> {
  const name = String(formData.get('name') || '').trim()
  const dateFrom = String(formData.get('date_from') || '')
  const dateTo = String(formData.get('date_to') || '')
  const yourName = String(formData.get('your_name') || '').trim()
  const useTemplate = formData.get('use_template') === 'on'

  if (!name || !dateFrom || !dateTo || !yourName) {
    throw new Error('Bitte alle Felder ausfüllen')
  }

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

  // 5) Set cookie & redirect
  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
  redirect(`/t/${joinCode}`)
}

export async function joinTrip(formData: FormData): Promise<void> {
  const code = String(formData.get('code') || '').trim().toUpperCase()
  const yourName = String(formData.get('your_name') || '').trim()
  if (!code || !yourName) throw new Error('Code und Name sind Pflicht')

  const admin = supabaseAdmin()
  const { data: trip } = await admin
    .from('trips')
    .select('id')
    .eq('join_code', code)
    .maybeSingle()
  if (!trip) throw new Error('Diesen Code gibt\'s nicht. Schau nochmal.')

  const sessionToken = newSessionToken()
  await admin.from('participants').insert({
    trip_id: trip.id,
    name: yourName,
    avatar_emoji: pickEmoji(),
    session_token: sessionToken,
  })

  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
  redirect(`/t/${code}`)
}

/**
 * Switch the active session cookie to one this browser already owns (from
 * localStorage). Validates that the session_token belongs to a participant
 * of the given trip — so a client can't forge entry into a trip they
 * haven't joined.
 *
 * On invalid token (e.g., trip got deleted, participant got cleaned up),
 * throws so the client can drop the stale entry.
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
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
  redirect(`/t/${code}`)
}
