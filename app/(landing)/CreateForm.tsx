'use client'
import { createTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateForm() {
  return (
    <form action={createTrip} className="space-y-4 p-4">
      <p className="text-xs text-muted-foreground">Du bekommst danach einen Link zum Teilen.</p>

      <div className="space-y-1.5">
        <label htmlFor="trip-name" className="text-xs font-medium text-muted-foreground">
          Name der Tour
        </label>
        <Input id="trip-name" name="name" placeholder="Z. B. Bodensee-Wochenende" required />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label htmlFor="trip-from" className="text-xs font-medium text-muted-foreground">
            Von
          </label>
          <Input id="trip-from" name="date_from" type="date" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="trip-to" className="text-xs font-medium text-muted-foreground">
            Bis
          </label>
          <Input id="trip-to" name="date_to" type="date" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="create-your-name" className="text-xs font-medium text-muted-foreground">
          Dein Name
        </label>
        <Input id="create-your-name" name="your_name" placeholder="Wie heißt du?" required />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="create-email" className="text-xs font-medium text-muted-foreground">
          E-Mail
        </label>
        <Input
          id="create-email"
          name="email"
          type="email"
          placeholder="du@example.com"
          autoComplete="email"
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Damit kannst du dich auf anderen Geräten wiederherstellen.
        </p>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-md py-1 text-sm">
        <input
          type="checkbox"
          name="use_template"
          defaultChecked
          className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
        />
        <span className="text-foreground/85">
          Vorlage „Camping-Wochenende" verwenden
          <span className="block text-xs text-muted-foreground">
            Setzt rund 15 Sachen wie Zelt, Schlafsack, Gaskocher vor.
          </span>
        </span>
      </label>

      <Button type="submit" className="w-full">
        Tour anlegen
      </Button>
    </form>
  )
}
