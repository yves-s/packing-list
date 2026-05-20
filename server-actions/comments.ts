'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentParticipant } from '@/lib/auth'

export async function addComment(itemId: string, text: string) {
  const p = await getCurrentParticipant()
  const clean = text.trim()
  if (!clean) return
  const supa = supabaseAdmin()

  const { data: item } = await supa.from('items')
    .select('id').eq('id', itemId).eq('trip_id', p.trip_id).maybeSingle()
  if (!item) throw new Error('Item gehört nicht zu deiner Tour')

  await supa.from('comments').insert({
    item_id: itemId, participant_id: p.id, trip_id: p.trip_id, text: clean,
  })
  revalidatePath(`/t/${p.join_code}`)
}
