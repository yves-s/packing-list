'use client'
import { cn } from '@/lib/utils'

export type FilterValue = 'alle' | 'offen' | 'meine'

const TABS: { v: FilterValue; label: string }[] = [
  { v: 'alle', label: 'Alle' },
  { v: 'offen', label: 'Offen' },
  { v: 'meine', label: 'Meine' },
]

export function Filter({
  value,
  onChange,
}: {
  value: FilterValue
  onChange: (v: FilterValue) => void
}) {
  return (
    <nav
      role="tablist"
      aria-label="Filter"
      className="flex gap-1.5 px-4 sm:px-6 pb-2.5"
    >
      {TABS.map((t) => {
        const active = value === t.v
        return (
          <button
            key={t.v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.v)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
