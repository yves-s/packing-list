'use client'
import { ItemCard } from './ItemCard'

const TITLE: Record<string, string> = {
  schlafen: 'Schlafen', kochen: 'Kochen', essen: 'Essen & Trinken',
  equipment: 'Equipment', persoenlich: 'Persönliches', sonstiges: 'Sonstiges',
}

export function CategorySection({ category, items, ...rest }: any) {
  return (
    <section className="p-4 space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{TITLE[category]}</h2>
      <div className="space-y-2">
        {items.map((it: any) => (
          <ItemCard key={it.id} item={it} {...rest} />
        ))}
      </div>
    </section>
  )
}
