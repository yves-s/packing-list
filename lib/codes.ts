const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0,O,1,I

export function generateJoinCode(): string {
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}

export function isValidJoinCode(input: string): boolean {
  return /^[A-Z2-9]{6}$/.test(input) && !/[01OI]/.test(input)
}
