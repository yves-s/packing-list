'use client'
import { cn } from '@/lib/utils'

export type FilterValue = 'alle' | 'offen' | 'meine'

const TABS: { v: FilterValue; label: string }[] = [
  { v: 'alle', label: 'Alle' },
  { v: 'offen', label: 'Offen' },
  { v: 'meine', label: 'Meine' },
]

export function Filter({ value, onChange }: { value: FilterValue; onChange: (v: FilterValue) => void }) {
  return (
    <nav className="sticky top-[88px] z-10 bg-background/90 backdrop-blur px-4 py-2 border-b flex gap-2">
      {TABS.map((t) => (
        <button
          key={t.v}
          onClick={() => onChange(t.v)}
          className={cn(
            'px-3 py-1 rounded-full text-sm border',
            value === t.v ? 'bg-foreground text-background' : 'bg-background',
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
