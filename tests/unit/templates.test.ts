import { describe, it, expect } from 'vitest'
import { CAMPING_TEMPLATE, categoryOrder } from '@/lib/templates'

describe('CAMPING_TEMPLATE', () => {
  it('has items in five distinct categories', () => {
    const cats = new Set(CAMPING_TEMPLATE.map((i) => i.category))
    expect(cats.size).toBeGreaterThanOrEqual(4)
  })
  it('each item has a name and quantity_needed >= 1', () => {
    for (const item of CAMPING_TEMPLATE) {
      expect(item.name).toBeTruthy()
      expect(item.quantity_needed).toBeGreaterThanOrEqual(1)
    }
  })
  it('contains the essentials', () => {
    const names = CAMPING_TEMPLATE.map((i) => i.name.toLowerCase())
    expect(names).toContain('zelt')
    expect(names.some((n) => n.includes('schlafsack'))).toBe(true)
    expect(names.some((n) => n.includes('gaskocher'))).toBe(true)
  })
})

describe('categoryOrder', () => {
  it('lists all six categories in stable order', () => {
    expect(categoryOrder).toEqual([
      'schlafen', 'kochen', 'essen', 'equipment', 'persoenlich', 'sonstiges',
    ])
  })
})
