'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { getKnownTrips } from '@/lib/trip-memory'
import { Plus, LogIn, Mail, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestRecovery } from '@/server-actions/trips'

type Mode = 'none' | 'create' | 'join' | 'recover'

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

  // While hydrating, render nothing structural to avoid SSR mismatch.
  // Once we know, default-open the create form for fresh users so they
  // don't have to click before they can start.
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

      <ActionBlock
        open={mode === 'recover'}
        onToggle={() => setMode(mode === 'recover' ? 'none' : 'recover')}
        icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
        label="Schon dabei? Identität wiederherstellen"
      >
        <RecoverForm />
      </ActionBlock>
    </section>
  )
}

function RecoverForm() {
  return (
    <form action={requestRecovery} className="space-y-3 p-4">
      <p className="text-xs text-muted-foreground">
        Trag deine E-Mail ein. Wir senden dir einen Link, der dich auf diesem Gerät wieder in alle deine Touren bringt.
      </p>
      <div className="space-y-1.5">
        <label htmlFor="recover-email" className="text-xs font-medium text-muted-foreground">
          E-Mail
        </label>
        <Input
          id="recover-email"
          name="email"
          type="email"
          placeholder="du@example.com"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" variant="secondary" className="w-full">
        Magic-Link senden
      </Button>
    </form>
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
