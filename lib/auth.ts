import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SESSION_COOKIE } from '@/lib/session'

/**
 * Resolves the participant from the session cookie and returns their
 * trip context. All server actions call this and use `trip_id` / `join_code`
 * to scope operations — these values are the trust boundary.
 */
export async function getCurrentParticipant() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Nicht eingeloggt')
  const { data } = await supabaseAdmin()
    .from('participants')
    .select('id, trip_id, name, avatar_emoji, trips(join_code)')
    .eq('session_token', token)
    .maybeSingle()
  if (!data || !data.trips) throw new Error('Session ungültig')
  return {
    id: data.id,
    name: data.name,
    avatar_emoji: data.avatar_emoji,
    trip_id: data.trip_id,
    join_code: (data.trips as any).join_code as string,
  }
}
