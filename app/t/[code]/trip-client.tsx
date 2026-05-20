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

export function TripClient(props: {
  trip: any; me: any; participants: any[]; items: any[]; claims: any[]; comments: any[];
  categoryOrder: Category[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterValue>('alle')
  useTripRealtime(props.trip.id, () => router.refresh())

  const visibleItems = props.items.filter((i) => {
    if (filter === 'alle')  return true
    const claimsForItem = props.claims.filter((c) => c.item_id === i.id)
    if (filter === 'offen') return claimsForItem.length === 0
    if (filter === 'meine') return claimsForItem.some((c) => c.participant_id === props.me.id)
    return true
  })

  return (
    <main className="mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="font-bold truncate">{props.trip.name}</h1>
          <ShareButton joinCode={props.trip.join_code} />
        </div>
        <div className="text-xs text-muted-foreground">
          {props.trip.date_from} – {props.trip.date_to}
        </div>
        <ParticipantAvatars participants={props.participants} />
      </header>

      <Filter value={filter} onChange={setFilter} />

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

      <AddItemFAB />
    </main>
  )
}
