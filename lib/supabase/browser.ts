// lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Used only for client-side Realtime subscriptions. All SELECT queries
// for the trip page run server-side via the admin client.
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
