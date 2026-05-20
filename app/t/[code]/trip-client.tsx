'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTripRealtime } from '@/lib/realtime'
import { CategorySection } from '@/components/CategorySection'
import { Filter, type FilterValue } from '@/components/Filter'
import { ParticipantAvatars } from '@/components/ParticipantAvatars'
import { ShareButton } from '@/components/ShareButton'
import { AddItemFAB } from '@/components/AddItemFAB'
import type { Category } from '@/lib/templates'

interface TripClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  me: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  claims: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[]
  categoryOrder: Category[]
}

function formatDateRange(from: string, to: string) {
  // ISO YYYY-MM-DD → "4.–6. Juni 2026"
  try {
    const f = new Date(from)
    const t = new Date(to)
    const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(t)
    const year = t.getFullYear()
    return `${f.getDate()}.–${t.getDate()}. ${month} ${year}`
  } catch {
    return `${from} – ${to}`
  }
}

export function TripClient(props: TripClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterValue>('alle')
  useTripRealtime(props.trip.id, () => router.refresh())

  const visibleItems = props.items.filter((i) => {
    if (filter === 'alle') return true
    const claimsForItem = props.claims.filter((c) => c.item_id === i.id)
    if (filter === 'offen') return claimsForItem.length === 0
    if (filter === 'meine') return claimsForItem.some((c) => c.participant_id === props.me.id)
    return true
  })

  const visibleCount = visibleItems.length

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-32 sm:px-6">
      {/* Sticky header — title + filter live in the same sticky container so positioning never breaks */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="px-4 sm:px-6 pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight leading-tight">
                {props.trip.name}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateRange(props.trip.date_from, props.trip.date_to)}
              </p>
            </div>
            <ShareButton joinCode={props.trip.join_code} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <ParticipantAvatars participants={props.participants} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {props.items.length} Sachen
            </span>
          </div>
        </div>
        <Filter value={filter} onChange={setFilter} />
      </div>

      {visibleCount === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === 'meine'
              ? 'Du hast noch nichts übernommen.'
              : filter === 'offen'
                ? 'Alles abgedeckt — schick.'
                : 'Noch nichts hier. Tipp auf das + um was hinzuzufügen.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {props.categoryOrder.map((cat) => {
            const its = visibleItems.filter((i) => i.category === cat)
            if (!its.length) return null
            return (
              <CategorySection
                key={cat}
                category={cat}
                items={its}
                claims={props.claims}
                comments={props.comments}
                participants={props.participants}
                me={props.me}
              />
            )
          })}
        </div>
      )}

      <AddItemFAB />
    </main>
  )
}
