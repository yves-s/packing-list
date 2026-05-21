'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { claimItem, unclaimItem } from '@/server-actions/claims'
import { addComment } from '@/server-actions/comments'
import { deleteItem, updateItem } from '@/server-actions/items'
import { Trash2, Send, Pencil } from 'lucide-react'

interface ItemSheetProps {
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
  onClose: () => void
}

export function ItemSheet({ item, claims, comments, participants, me, onClose }: ItemSheetProps) {
  const [text, setText] = useState('')
  const [isPending, start] = useTransition()
  const [editing, setEditing] = useState(false)

  // Scope to THIS item.
  const itemClaims = claims.filter((c) => c.item_id === item.id)
  const itemComments = comments.filter((c) => c.item_id === item.id)
  const mine = itemClaims.find((c) => c.participant_id === me.id)
  const claimed = itemClaims.reduce((sum, c) => sum + c.quantity, 0)
  const canDelete = item.created_by === me.id

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88dvh] flex-col rounded-t-2xl border-t p-0 sm:max-w-lg sm:mx-auto"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-lg leading-tight">{item.name}</SheetTitle>
          <p className="text-xs text-muted-foreground tabular-nums">
            {claimed} / {item.quantity_needed} zugesagt
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {editing ? (
            <EditForm
              item={item}
              isPending={isPending}
              onSave={(fields) =>
                start(async () => {
                  await updateItem(item.id, fields)
                  setEditing(false)
                })
              }
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {item.note && (
                <p className="text-sm leading-relaxed text-foreground/80">{item.note}</p>
              )}

              {/* Primary action row */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={mine ? 'secondary' : 'default'}
                  disabled={isPending}
                  onClick={() => start(() => (mine ? unclaimItem(item.id) : claimItem(item.id, 1)))}
                >
                  {mine ? 'Doch nicht' : 'Ich bring eins'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() => setEditing(true)}
                  aria-label="Bearbeiten"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() =>
                      start(async () => {
                        await deleteItem(item.id)
                        onClose()
                      })
                    }
                    aria-label="Item löschen"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Zusagen */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Zusagen
            </h3>
            {itemClaims.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keiner.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {itemClaims.map((c) => {
                  const p = participants.find((p) => p.id === c.participant_id)
                  return (
                    <li key={c.id} className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        {p?.avatar_emoji}
                      </span>
                      <span className="flex-1">{p?.name}</span>
                      <span className="tabular-nums text-muted-foreground">{c.quantity}×</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Kommentare */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kommentare
            </h3>
            {itemComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine.</p>
            ) : (
              <ul className="mb-3 space-y-2 text-sm">
                {itemComments.map((c) => {
                  const p = participants.find((p) => p.id === c.participant_id)
                  return (
                    <li key={c.id} className="leading-snug">
                      <span className="font-medium">
                        {p?.avatar_emoji} {p?.name}:
                      </span>{' '}
                      <span className="text-foreground/80">{c.text}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Sticky comment input footer */}
        <form
          action={() =>
            start(async () => {
              if (!text.trim()) return
              await addComment(item.id, text)
              setText('')
            })
          }
          className="flex items-end gap-2 border-t bg-background px-5 py-3"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Kommentar schreiben…"
            rows={1}
            className="min-h-[40px] max-h-32 flex-1 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || isPending}
            aria-label="Kommentar senden"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function EditForm({
  item,
  isPending,
  onSave,
  onCancel,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any
  isPending: boolean
  onSave: (fields: { name: string; quantity_needed: number; note: string | null }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState<string>(item.name ?? '')
  const [quantity, setQuantity] = useState<string>(String(item.quantity_needed ?? 1))
  const [note, setNote] = useState<string>(item.note ?? '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = Math.max(1, Math.floor(Number(quantity) || 1))
    onSave({
      name: name.trim(),
      quantity_needed: q,
      note: note.trim() ? note.trim() : null,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="edit-name" className="text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-quantity" className="text-xs font-medium text-muted-foreground">
          Anzahl
        </label>
        <Input
          id="edit-quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-note" className="text-xs font-medium text-muted-foreground">
          Notiz <span className="font-normal text-muted-foreground/70">(optional)</span>
        </label>
        <Textarea
          id="edit-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={isPending || !name.trim()} className="flex-1">
          Speichern
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
