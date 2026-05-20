import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SESSION_COOKIE } from '@/lib/session'
import { categoryOrder } from '@/lib/templates'
import { TripClient } from './trip-client'

export default async function TripPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const admin = supabaseAdmin()

  const { data: trip } = await admin
    .from('trips').select('*').eq('join_code', code).maybeSingle()
  if (!trip) notFound()

  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  const { data: me } = token
    ? await admin.from('participants').select('*').eq('session_token', token).eq('trip_id', trip.id).maybeSingle()
    : { data: null }
  if (!me) redirect(`/t/${code}/join`)

  const [{ data: items }, { data: claims }, { data: comments }, { data: participants }] = await Promise.all([
    admin.from('items')        .select('*').eq('trip_id', trip.id).order('created_at'),
    admin.from('claims')       .select('*').eq('trip_id', trip.id),
    admin.from('comments')     .select('*').eq('trip_id', trip.id).order('created_at'),
    admin.from('participants') .select('id, name, avatar_emoji').eq('trip_id', trip.id),
  ])

  return (
    <TripClient
      trip={trip}
      me={me}
      participants={participants ?? []}
      items={items ?? []}
      claims={claims ?? []}
      comments={comments ?? []}
      categoryOrder={categoryOrder}
    />
  )
}
