const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 6

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length))
  }
  return code
}

export function generatePlayerId(): string {
  return crypto.randomUUID()
}

export function calculateScore(isCorrect: boolean): number {
  return isCorrect ? 10 : 0
}

export function formatScore(score: number): string {
  return score.toLocaleString()
}

export function sanitizeDisplayName(name: string): string {
  return name.trim().slice(0, 20)
}

export function generateSuggestionName(base: string, attempts: number): string {
  if (attempts === 1) return `${base}2`
  const suffixes = ['2', '_01', '_02', '_03', '_04']
  const idx = Math.min(attempts - 2, suffixes.length - 1)
  return `${base}${suffixes[idx]}`
}
