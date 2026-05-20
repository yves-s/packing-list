'use client'
import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { claimItem, unclaimItem } from '@/server-actions/claims'
import { ItemSheet } from './ItemSheet'
import { MessageCircle } from 'lucide-react'

const CATEGORY_EMOJI: Record<string, string> = {
  schlafen: '🛏️', kochen: '🍳', essen: '🥖', equipment: '🔦', persoenlich: '👕', sonstiges: '📦',
}

export function ItemCard({ item, claims, comments, participants, me }: any) {
  const [open, setOpen] = useState(false)
  const [isPending, start] = useTransition()
  const mine = claims.find((c: any) => c.participant_id === me.id)
  const claimed = claims.reduce((sum: number, c: any) => sum + c.quantity, 0)
  const claimers = claims.map((c: any) => participants.find((p: any) => p.id === c.participant_id)).filter(Boolean)
  const itemComments = comments.filter((c: any) => c.item_id === item.id)

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    start(() => (mine ? unclaimItem(item.id) : claimItem(item.id, 1)))
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 active:bg-muted transition cursor-pointer"
      >
        <div className="text-2xl">{CATEGORY_EMOJI[item.category] ?? '📦'}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{claimed} / {item.quantity_needed} zugesagt</span>
            <div className="flex -space-x-1">
              {claimers.slice(0, 3).map((p: any) => (
                <span key={p.id} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs ring-1 ring-background">
                  {p.avatar_emoji}
                </span>
              ))}
            </div>
            {claimed > item.quantity_needed && (
              <Badge variant="secondary" className="text-[10px]">schon abgedeckt</Badge>
            )}
          </div>
        </div>
        {itemComments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />{itemComments.length}
          </div>
        )}
        <Button
          size="sm" variant={mine ? 'secondary' : 'default'} disabled={isPending}
          onClick={toggle}
        >
          {mine ? '✓' : '+'}
        </Button>
      </div>
      {open && (
        <ItemSheet
          item={item} claims={claims} comments={comments} participants={participants} me={me}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
