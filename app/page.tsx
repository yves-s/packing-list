import { Tent } from 'lucide-react'
import { CreateForm } from './(landing)/CreateForm'
import { JoinForm } from './(landing)/JoinForm'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-10 sm:py-16">
      <header className="space-y-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
          <Tent className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">Camping Packen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wer bringt was mit? Eine Liste, alle drauf.
          </p>
        </div>
      </header>

      <div className="mt-10 space-y-4">
        <CreateForm />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
              oder
            </span>
          </div>
        </div>
        <JoinForm />
      </div>
    </main>
  )
}
