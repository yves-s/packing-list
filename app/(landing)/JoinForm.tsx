'use client'
import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function JoinForm() {
  return (
    <form action={joinTrip} className="space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">Einer bestehenden Tour beitreten</h2>
      <Input name="code" placeholder="Code (z. B. ABC234)" required maxLength={6} className="uppercase tracking-widest" />
      <Input name="your_name" placeholder="Wie heißt du?" required />
      <Button type="submit" variant="secondary" className="w-full">Beitreten</Button>
    </form>
  )
}
