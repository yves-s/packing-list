'use client'
import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function JoinForm() {
  return (
    <form action={joinTrip} className="space-y-4 p-4">
      <p className="text-xs text-muted-foreground">Du hast einen Code von einem Buddy bekommen.</p>

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

      <div className="space-y-1.5">
        <label htmlFor="join-email" className="text-xs font-medium text-muted-foreground">
          E-Mail
        </label>
        <Input
          id="join-email"
          name="email"
          type="email"
          placeholder="du@example.com"
          autoComplete="email"
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Wenn du schon dabei warst, kommst du mit dem Magic-Link wieder rein.
        </p>
      </div>

      <Button type="submit" variant="secondary" className="w-full">
        Beitreten
      </Button>
    </form>
  )
}
