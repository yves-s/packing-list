export type Category =
  | 'schlafen' | 'kochen' | 'essen' | 'equipment' | 'persoenlich' | 'sonstiges'

export const categoryOrder: Category[] = [
  'schlafen', 'kochen', 'essen', 'equipment', 'persoenlich', 'sonstiges',
]

export interface TemplateItem {
  name: string
  category: Category
  quantity_needed: number
}

export const CAMPING_TEMPLATE: TemplateItem[] = [
  { name: 'Zelt',          category: 'schlafen',  quantity_needed: 2 },
  { name: 'Schlafsack',    category: 'schlafen',  quantity_needed: 4 },
  { name: 'Isomatte',      category: 'schlafen',  quantity_needed: 4 },
  { name: 'Gaskocher',     category: 'kochen',    quantity_needed: 1 },
  { name: 'Topf',          category: 'kochen',    quantity_needed: 1 },
  { name: 'Pfanne',        category: 'kochen',    quantity_needed: 1 },
  { name: 'Besteck-Set',   category: 'kochen',    quantity_needed: 4 },
  { name: 'Wasser (5l)',   category: 'essen',     quantity_needed: 2 },
  { name: 'Frühstück',     category: 'essen',     quantity_needed: 1 },
  { name: 'Snacks',        category: 'essen',     quantity_needed: 1 },
  { name: 'Pavillon',      category: 'equipment', quantity_needed: 1 },
  { name: 'Stirnlampe',    category: 'equipment', quantity_needed: 4 },
  { name: 'Feuerzeug',     category: 'equipment', quantity_needed: 2 },
  { name: 'Müllsäcke',     category: 'equipment', quantity_needed: 1 },
  { name: 'Klappstuhl',    category: 'equipment', quantity_needed: 4 },
]
