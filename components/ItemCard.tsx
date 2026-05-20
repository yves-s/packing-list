'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { claimItem, unclaimItem } from '@/server-actions/claims'
import { ItemSheet } from './ItemSheet'
import {
  Bed,
  ChefHat,
  UtensilsCrossed,
  Flashlight,
  Shirt,
  Package,
  MessageCircle,
  Check,
  Plus,
} from 'lucide-react'

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  schlafen: Bed,
  kochen: ChefHat,
  essen: UtensilsCrossed,
  equipment: Flashlight,
  persoenlich: Shirt,
  sonstiges: Package,
}

interface ItemCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  claims: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  me: any
}

export function ItemCard({ item, claims, comments, participants, me }: ItemCardProps) {
  const [open, setOpen] = useState(false)
  const [isPending, start] = useTransition()

  // CRITICAL: scope all claim-derived state to THIS item only.
  const itemClaims = claims.filter((c) => c.item_id === item.id)
  const itemComments = comments.filter((c) => c.item_id === item.id)
  const mine = itemClaims.find((c) => c.participant_id === me.id)
  const claimed = itemClaims.reduce((sum, c) => sum + c.quantity, 0)
  const claimers = itemClaims
    .map((c) => participants.find((p) => p.id === c.participant_id))
    .filter(Boolean)
  const Icon = CATEGORY_ICON[item.category] ?? Package
  const isCovered = claimed >= item.quantity_needed

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    start(() => (mine ? unclaimItem(item.id) : claimItem(item.id, 1)))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 active:bg-muted"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
            isCovered ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
          }`}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-medium leading-tight">{item.name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {claimed}/{item.quantity_needed}
            </span>
            {claimers.length > 0 && (
              <span className="flex -space-x-1">
                {claimers.slice(0, 3).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] ring-1 ring-border"
                    title={p.name}
                  >
                    {p.avatar_emoji}
                  </span>
                ))}
              </span>
            )}
          </span>
        </span>

        {itemComments.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            {itemComments.length}
          </span>
        )}

        <span
          role="button"
          aria-label={mine ? 'Zusage zurücknehmen' : 'Ich bring eins'}
          onClick={toggle}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition active:scale-95 ${
            mine
              ? 'border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-border bg-background text-foreground hover:bg-muted'
          } ${isPending ? 'pointer-events-none opacity-50' : ''}`}
        >
          {mine ? (
            <Check className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2} />
          )}
        </span>
      </button>

      {open && (
        <ItemSheet
          item={item}
          claims={claims}
          comments={comments}
          participants={participants}
          me={me}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
