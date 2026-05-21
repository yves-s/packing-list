import Link from 'next/link'
import { Mail } from 'lucide-react'

interface Props {
  searchParams: Promise<{ email?: string; code?: string }>
}

export default async function InboxCheckPage({ searchParams }: Props) {
  const { email, code } = await searchParams

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-16 sm:py-24">
      <div className="space-y-6">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
          <Mail className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">
            Check deine Inbox
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {email ? (
              <>
                Wir haben dir einen Magic-Link an <span className="font-medium text-foreground">{email}</span> geschickt.
                {' '}
                {code
                  ? `Klick den, um in Tour ${code} zu kommen.`
                  : 'Klick den, um deine Touren auf diesem Gerät wiederherzustellen.'}
              </>
            ) : (
              <>Klick den Link in deinem Postfach, um anzukommen.</>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Kein Mail bekommen? Schau im Spam-Ordner. Oder warte ein paar Sekunden.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  )
}
