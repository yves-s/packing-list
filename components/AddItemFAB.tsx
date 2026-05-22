'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { addItem } from '@/server-actions/items'
import { categoryOrder } from '@/lib/templates'
import { useKeyboardInset } from '@/lib/use-keyboard-inset'

const CATEGORY_LABEL: Record<string, string> = {
  schlafen: 'Schlafen',
  kochen: 'Kochen',
  essen: 'Essen & Trinken',
  equipment: 'Equipment',
  persoenlich: 'Persönliches',
  sonstiges: 'Sonstiges',
}

export function AddItemFAB() {
  const [open, setOpen] = useState(false)
  const [isPending, start] = useTransition()
  const keyboardInset = useKeyboardInset(open)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] transition active:scale-95 hover:-translate-y-[1px]"
        style={{ height: 56, width: 56 }}
        aria-label="Item hinzufügen"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex flex-col rounded-t-2xl border-t p-0 sm:max-w-lg sm:mx-auto"
          style={{
            bottom: keyboardInset,
            maxHeight: `calc(85dvh - ${keyboardInset}px)`,
          }}
        >
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="text-lg">Neue Sache</SheetTitle>
          </SheetHeader>
          <form
            action={async (fd) =>
              start(async () => {
                await addItem(fd)
                setOpen(false)
              })
            }
            className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
          >
            <div className="space-y-1.5">
              <label htmlFor="add-name" className="text-xs font-medium text-muted-foreground">
                Was
              </label>
              <Input id="add-name" name="name" placeholder="Z. B. Marshmallows" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="add-category"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Kategorie
                </label>
                <select
                  id="add-category"
                  name="category"
                  defaultValue="sonstiges"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {categoryOrder.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="add-quantity"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Anzahl
                </label>
                <Input
                  id="add-quantity"
                  name="quantity_needed"
                  type="number"
                  min={1}
                  defaultValue={1}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="add-note" className="text-xs font-medium text-muted-foreground">
                Notiz <span className="font-normal text-muted-foreground/70">(optional)</span>
              </label>
              <Input id="add-note" name="note" placeholder="z. B. Marke, Größe …" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              Hinzufügen
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
