import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function JoinGate({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <main className="mx-auto max-w-md p-6 pt-12 space-y-6">
      <h1 className="text-xl font-bold">Beitritt</h1>
      <p>Du wurdest zu einer Tour eingeladen. Wie heißt du?</p>
      <form action={joinTrip} className="space-y-3">
        <input type="hidden" name="code" value={code} />
        <Input name="your_name" placeholder="Dein Name" required />
        <Button type="submit" className="w-full">Beitreten</Button>
      </form>
    </main>
  )
}
