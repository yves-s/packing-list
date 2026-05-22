'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useKeyboardInset } from '@/lib/use-keyboard-inset'

interface Participant {
  id: string
  name: string
  avatar_emoji: string
}

interface ParticipantsSheetProps {
  open: boolean
  onClose: () => void
  participants: Participant[]
  meId: string
}

export function ParticipantsSheet({ open, onClose, participants, meId }: ParticipantsSheetProps) {
  const keyboardInset = useKeyboardInset(open)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="flex flex-col rounded-t-2xl border-t p-0 sm:max-w-lg sm:mx-auto"
        style={{
          bottom: keyboardInset,
          maxHeight: `calc(85dvh - ${keyboardInset}px)`,
        }}
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-lg">Teilnehmer ({participants.length})</SheetTitle>
        </SheetHeader>
        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                {p.avatar_emoji}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {p.name}
                {p.id === meId && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(du)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
