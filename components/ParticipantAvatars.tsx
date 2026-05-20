'use client'

export function ParticipantAvatars({ participants }: { participants: any[] }) {
  return (
    <div className="flex -space-x-2 mt-2">
      {participants.map((p) => (
        <div key={p.id}
          title={p.name}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background"
        >
          {p.avatar_emoji}
        </div>
      ))}
    </div>
  )
}
