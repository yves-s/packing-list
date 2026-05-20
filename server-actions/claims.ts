'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentParticipant } from '@/lib/auth'

export async function claimItem(itemId: string, quantity = 1) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  const { data: item } = await supa.from('items')
    .select('id').eq('id', itemId).eq('trip_id', p.trip_id).maybeSingle()
  if (!item) throw new Error('Item gehört nicht zu deiner Tour')

  await supa.from('claims').upsert({
    item_id: itemId, participant_id: p.id, trip_id: p.trip_id, quantity,
  }, { onConflict: 'item_id,participant_id' })
  revalidatePath(`/t/${p.join_code}`)
}

export async function unclaimItem(itemId: string) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  await supa.from('claims').delete()
    .eq('item_id', itemId)
    .eq('participant_id', p.id)
    .eq('trip_id', p.trip_id)
  revalidatePath(`/t/${p.join_code}`)
}
