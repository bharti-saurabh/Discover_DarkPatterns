// Mulberry32 — fast, seedable, good distribution
export function createPrng(seed: number) {
  let s = seed
  return function rand(): number {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export type Prng = ReturnType<typeof createPrng>

export function randInt(rand: Prng, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

export function randPick<T>(rand: Prng, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function randBool(rand: Prng, probability = 0.5): boolean {
  return rand() < probability
}

export function randFloat(rand: Prng, min: number, max: number, decimals = 2): number {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals))
}

export function randDate(rand: Prng, start: Date, end: Date): string {
  const t = start.getTime() + rand() * (end.getTime() - start.getTime())
  return new Date(t).toISOString().split('T')[0]
}

export function randDatetime(rand: Prng, start: Date, end: Date): string {
  const t = start.getTime() + rand() * (end.getTime() - start.getTime())
  return new Date(t).toISOString()
}

export function randId(rand: Prng, prefix: string): string {
  const hex = Math.floor(rand() * 0xFFFFFFFF).toString(16).padStart(8, '0')
  const hex2 = Math.floor(rand() * 0xFFFFFF).toString(16).padStart(6, '0')
  return `${prefix}-${hex}-${hex2}`
}

export function randHash(rand: Prng, length = 64): string {
  const chars = '0123456789abcdef'
  let h = ''
  for (let i = 0; i < length; i++) h += chars[Math.floor(rand() * 16)]
  return h
}
