'use client'
import { createTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateForm() {
  return (
    <form action={createTrip} className="space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">Neue Tour anlegen</h2>
      <Input name="name" placeholder="Z. B. Bodensee-Wochenende" required />
      <div className="grid grid-cols-2 gap-2">
        <Input name="date_from" type="date" required />
        <Input name="date_to"   type="date" required />
      </div>
      <Input name="your_name" placeholder="Wie heißt du?" required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="use_template" defaultChecked />
        Vorlage „Camping-Wochenende" verwenden
      </label>
      <Button type="submit" className="w-full">Tour anlegen</Button>
    </form>
  )
}
