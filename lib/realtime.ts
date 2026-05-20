'use client'
import { useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

export function useTripRealtime(tripId: string, onChange: () => void) {
  useEffect(() => {
    const supa = supabaseBrowser()
    const channel = supa
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `trip_id=eq.${tripId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claims', filter: `trip_id=eq.${tripId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `trip_id=eq.${tripId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `trip_id=eq.${tripId}` },
        onChange,
      )
      .subscribe()
    return () => {
      supa.removeChannel(channel)
    }
  }, [tripId, onChange])
}
