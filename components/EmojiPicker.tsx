'use client'
import { useEffect, useId, useState } from 'react'
import { AVATAR_EMOJIS } from '@/lib/emojis'
import { cn } from '@/lib/utils'

interface EmojiPickerProps {
  /** Form field name. The currently-selected emoji is submitted as this. */
  name?: string
  /** Optional initial selection. If absent, a random emoji is picked on mount. */
  defaultValue?: string
  /** Field label shown above the grid. */
  label?: string
}

/**
 * Click-grid avatar picker. Renders a hidden input so the value submits
 * with the surrounding form.
 *
 * To avoid SSR/CSR hydration mismatch, the deterministic first emoji is
 * rendered initially, then a useEffect swaps to a random pick on the
 * client right after mount. The flash is unnoticeable in practice.
 */
export function EmojiPicker({
  name = 'avatar_emoji',
  defaultValue,
  label = 'Dein Avatar',
}: EmojiPickerProps) {
  const fieldId = useId()
  const [selected, setSelected] = useState<string>(defaultValue ?? AVATAR_EMOJIS[0])
  const [touched, setTouched] = useState(false)

  // Pick a random default on the client (after hydration) — only if the
  // caller didn't provide one and the user hasn't picked yet.
  useEffect(() => {
    if (defaultValue || touched) return
    setSelected(AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)])
  }, [defaultValue, touched])

  const onPick = (emoji: string) => {
    setTouched(true)
    setSelected(emoji)
  }

  return (
    <div className="space-y-1.5">
      <p id={fieldId} className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <input type="hidden" name={name} value={selected} />
      <div
        role="radiogroup"
        aria-labelledby={fieldId}
        className="grid grid-cols-8 gap-1.5 rounded-lg border border-border bg-card p-2"
      >
        {AVATAR_EMOJIS.map((emoji) => {
          const active = emoji === selected
          return (
            <button
              key={emoji}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(emoji)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-xl leading-none transition',
                active
                  ? 'bg-foreground/10 ring-2 ring-foreground'
                  : 'hover:bg-muted active:scale-95',
              )}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}
