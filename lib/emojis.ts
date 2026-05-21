/**
 * Curated set of avatar emojis offered when joining a trip.
 * Tries to cover a few flavours:
 * - Faces with personality (mood, vibe)
 * - Camping / outdoors
 * - Animals
 * - Sport / activity
 *
 * Stored as text in `participants.avatar_emoji`.
 */
export const AVATAR_EMOJIS: readonly string[] = [
  // Faces
  '😎', '🤓', '🥳', '🤠', '🧐', '😴', '🤩', '🥹',
  '🤗', '😺', '🙃', '😉',
  // Outdoors / camping
  '🏕️', '⛺', '🔥', '🌲', '🌿', '🍄', '🌞', '🌙',
  '🏔️', '🌊', '🎒', '🥾',
  // Animals
  '🐻', '🦊', '🦝', '🦉', '🐺', '🦌', '🐿️', '🦅',
  // Activity
  '🚴', '🛶', '🎣', '🪵',
] as const

export function isValidAvatarEmoji(input: string | null | undefined): boolean {
  if (!input) return false
  return AVATAR_EMOJIS.includes(input)
}

export function pickRandomEmoji(): string {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
}
