import codes from '@/data/uom-codes.json'

export type Uom = { code: string; description: string }

export const getAllUoms = (): Uom[] => codes

export const findUom = (code: string): Uom | undefined =>
  codes.find(u => u.code === code)

export const searchUoms = (q: string): Uom[] =>
  codes.filter(
    u =>
      u.description.toLowerCase().includes(q.toLowerCase()) ||
      u.code.toLowerCase().includes(q.toLowerCase())
  )
