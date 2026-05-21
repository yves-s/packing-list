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

/**
 * Update name / quantity_needed / note of an item. Open to any
 * participant in the same trip — this is a collaborative list, so
 * anyone can correct titles or adjust counts.
 */
export async function updateItem(
  itemId: string,
  fields: { name?: string; quantity_needed?: number; note?: string | null },
) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  const patch: { name?: string; quantity_needed?: number; note?: string | null } = {}
  if (typeof fields.name === 'string') {
    const trimmed = fields.name.trim()
    if (!trimmed) throw new Error('Name fehlt')
    patch.name = trimmed
  }
  if (typeof fields.quantity_needed === 'number') {
    const q = Math.floor(fields.quantity_needed)
    if (!Number.isFinite(q) || q < 1) throw new Error('Anzahl muss mindestens 1 sein')
    patch.quantity_needed = q
  }
  if (fields.note !== undefined) {
    const n = fields.note === null ? null : String(fields.note).trim() || null
    patch.note = n
  }
  if (Object.keys(patch).length === 0) return

  await supa
    .from('items')
    .update(patch)
    .eq('id', itemId)
    .eq('trip_id', p.trip_id)
  revalidatePath(`/t/${p.join_code}`)
}
