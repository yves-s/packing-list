'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { claimItem, unclaimItem } from '@/server-actions/claims'
import { addComment } from '@/server-actions/comments'
import { deleteItem } from '@/server-actions/items'

export function ItemSheet({ item, claims, comments, participants, me, onClose }: any) {
  const [text, setText] = useState('')
  const [isPending, start] = useTransition()
  const mine = claims.find((c: any) => c.participant_id === me.id)
  const itemComments = comments.filter((c: any) => c.item_id === item.id)
  const canDelete = item.created_by === me.id

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            {item.note || 'Keine Notiz.'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={isPending}
              onClick={() => start(() => (mine ? unclaimItem(item.id) : claimItem(item.id, 1)))}
            >
              {mine ? 'Doch nicht' : 'Ich bring eins'}
            </Button>
            {canDelete && (
              <Button variant="ghost" disabled={isPending}
                onClick={() => start(async () => { await deleteItem(item.id); onClose() })}>
                Löschen
              </Button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Zusagen</h3>
            <ul className="space-y-1 text-sm">
              {claims.map((c: any) => {
                const p = participants.find((p: any) => p.id === c.participant_id)
                return <li key={c.id}>{p?.avatar_emoji} {p?.name} — {c.quantity}×</li>
              })}
              {claims.length === 0 && <li className="text-muted-foreground">Noch keiner.</li>}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Kommentare</h3>
            <ul className="space-y-2 text-sm mb-2">
              {itemComments.map((c: any) => {
                const p = participants.find((p: any) => p.id === c.participant_id)
                return (
                  <li key={c.id}>
                    <span className="font-medium">{p?.avatar_emoji} {p?.name}: </span>{c.text}
                  </li>
                )
              })}
            </ul>
            <form
              action={() => start(async () => { await addComment(item.id, text); setText('') })}
              className="flex gap-2"
            >
              <Textarea
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Kommentar…" rows={1}
              />
              <Button type="submit" disabled={!text.trim() || isPending}>Senden</Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
