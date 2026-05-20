import { CreateForm } from './(landing)/CreateForm'
import { JoinForm } from './(landing)/JoinForm'

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-md p-6 pt-12 space-y-10">
      <header className="text-center space-y-2">
        <div className="text-5xl">⛺</div>
        <h1 className="text-2xl font-bold">Camping Packen</h1>
        <p className="text-sm text-muted-foreground">
          Wer bringt was mit? Eine Liste, alle drauf.
        </p>
      </header>
      <CreateForm />
      <div className="text-center text-xs text-muted-foreground">— oder —</div>
      <JoinForm />
    </main>
  )
}
