import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function JoinGate({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-10 sm:py-16">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Einladung
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tour <span className="font-mono">{code}</span> beitreten
        </h1>
        <p className="text-sm text-muted-foreground">
          Trag dich kurz ein, dann bist du dabei.
        </p>
      </header>

      <form action={joinTrip} className="mt-10 space-y-4">
        <input type="hidden" name="code" value={code} />

        <div className="space-y-1.5">
          <label htmlFor="invite-name" className="text-xs font-medium text-muted-foreground">
            Dein Name
          </label>
          <Input id="invite-name" name="your_name" placeholder="Wie heißt du?" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground">
            E-Mail
          </label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="du@example.com"
            autoComplete="email"
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Damit kommst du auf anderen Geräten wieder rein.
          </p>
        </div>

        <Button type="submit" className="w-full">
          Beitreten
        </Button>
      </form>
    </main>
  )
}
