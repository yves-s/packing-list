'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentParticipant } from '@/lib/auth'

export async function addItem(formData: FormData) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || 'sonstiges')
  const quantity = Math.max(1, Number(formData.get('quantity_needed') || 1))
  const note = String(formData.get('note') || '').trim() || null
  if (!name) throw new Error('Name fehlt')

  await supa.from('items').insert({
    trip_id: p.trip_id, name, category, quantity_needed: quantity, note, created_by: p.id,
  })
  revalidatePath(`/t/${p.join_code}`)
}

export async function deleteItem(itemId: string) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  // Ownership AND trip-scope check — defense against forged item IDs.
  await supa.from('items').delete()
    .eq('id', itemId)
    .eq('created_by', p.id)
    .eq('trip_id', p.trip_id)
  revalidatePath(`/t/${p.join_code}`)
}
