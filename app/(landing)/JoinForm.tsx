'use client'
import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function JoinForm() {
  return (
    <form action={joinTrip} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">Tour beitreten</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Du hast einen Code von einem Buddy bekommen.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="join-code" className="text-xs font-medium text-muted-foreground">
          Code
        </label>
        <Input
          id="join-code"
          name="code"
          placeholder="ABC234"
          required
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="text-center uppercase tracking-[0.4em] text-lg font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="join-your-name" className="text-xs font-medium text-muted-foreground">
          Dein Name
        </label>
        <Input id="join-your-name" name="your_name" placeholder="Wie heißt du?" required />
      </div>

      <Button type="submit" variant="secondary" className="w-full">
        Beitreten
      </Button>
    </form>
  )
}
