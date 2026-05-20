// lib/auth.ts
import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SESSION_COOKIE } from '@/lib/session'

export async function getCurrentParticipant() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Nicht eingeloggt')

  const supa = supabaseAdmin()
  const { data: participant } = await supa
    .from('participants')
    .select('id, trip_id, name, avatar_emoji')
    .eq('session_token', token)
    .maybeSingle()
  if (!participant) throw new Error('Session ungültig')

  const { data: trip } = await supa
    .from('trips')
    .select('join_code')
    .eq('id', participant.trip_id)
    .maybeSingle()
  if (!trip) throw new Error('Trip nicht gefunden')

  return {
    id: participant.id,
    name: participant.name,
    avatar_emoji: participant.avatar_emoji,
    trip_id: participant.trip_id,
    join_code: trip.join_code,
  }
}
