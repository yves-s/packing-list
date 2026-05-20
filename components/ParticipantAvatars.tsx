'use client'

interface Participant {
  id: string
  name: string
  avatar_emoji: string
}

export function ParticipantAvatars({ participants }: { participants: Participant[] }) {
  const visible = participants.slice(0, 6)
  const overflow = Math.max(0, participants.length - visible.length)

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map((p) => (
          <div
            key={p.id}
            title={p.name}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs ring-2 ring-background"
          >
            {p.avatar_emoji}
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 text-xs text-muted-foreground tabular-nums">+{overflow}</span>
      )}
    </div>
  )
}
