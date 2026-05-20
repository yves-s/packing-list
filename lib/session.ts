import { nanoid } from 'nanoid'

export const SESSION_COOKIE = 'camping_session'

export function newSessionToken(): string {
  return nanoid(32)
}
