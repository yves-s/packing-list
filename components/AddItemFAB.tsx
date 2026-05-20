'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { addItem } from '@/server-actions/items'
import { categoryOrder } from '@/lib/templates'

export function AddItemFAB() {
  const [open, setOpen] = useState(false)
  const [isPending, start] = useTransition()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:scale-95 transition"
        aria-label="Item hinzufügen"
      >
        <Plus className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Neues Item</SheetTitle></SheetHeader>
          <form
            action={async (fd) => start(async () => { await addItem(fd); setOpen(false) })}
            className="space-y-3 py-4"
          >
            <Input name="name" placeholder="Z. B. Marshmallows" required />
            <select name="category" className="w-full rounded-md border bg-background p-2">
              {categoryOrder.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input name="quantity_needed" type="number" min={1} defaultValue={1} />
            <Input name="note" placeholder="Notiz (optional)" />
            <Button type="submit" disabled={isPending} className="w-full">Hinzufügen</Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
