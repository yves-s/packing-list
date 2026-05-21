'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { getKnownTrips } from '@/lib/trip-memory'
import { Plus, LogIn, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'none' | 'create' | 'join'

export function LandingActions({
  createSlot,
  joinSlot,
}: {
  createSlot: ReactNode
  joinSlot: ReactNode
}) {
  const [hasKnown, setHasKnown] = useState<boolean | null>(null)
  const [mode, setMode] = useState<Mode>('none')

  useEffect(() => {
    setHasKnown(getKnownTrips().length > 0)
  }, [])

  // Default-open the create form for fresh users so they don't have to
  // click before they can start.
  useEffect(() => {
    if (hasKnown === false) setMode('create')
  }, [hasKnown])

  if (hasKnown === null) return null

  return (
    <section className="space-y-3">
      {hasKnown && (
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Etwas Neues starten
        </h2>
      )}

      <ActionBlock
        open={mode === 'create'}
        onToggle={() => setMode(mode === 'create' ? 'none' : 'create')}
        icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
        label="Neue Tour starten"
      >
        {createSlot}
      </ActionBlock>

      <ActionBlock
        open={mode === 'join'}
        onToggle={() => setMode(mode === 'join' ? 'none' : 'join')}
        icon={<LogIn className="h-4 w-4" strokeWidth={1.75} />}
        label="Mit Code dazustoßen"
      >
        {joinSlot}
      </ActionBlock>
    </section>
  )
}

function ActionBlock({
  open,
  onToggle,
  icon,
  label,
  children,
}: {
  open: boolean
  onToggle: () => void
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <span className="flex-1 text-sm font-medium">{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={1.75}
        />
      </button>
      {open && <div className="border-t border-border p-1.5">{children}</div>}
    </div>
  )
}
