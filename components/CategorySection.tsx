'use client'
import { ItemCard } from './ItemCard'
import type { Category } from '@/lib/templates'

const TITLE: Record<Category, string> = {
  schlafen: 'Schlafen',
  kochen: 'Kochen',
  essen: 'Essen & Trinken',
  equipment: 'Equipment',
  persoenlich: 'Persönliches',
  sonstiges: 'Sonstiges',
}

interface CategorySectionProps {
  category: Category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  claims: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  me: any
}

export function CategorySection({
  category,
  items,
  claims,
  comments,
  participants,
  me,
}: CategorySectionProps) {
  return (
    <section className="py-4">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {TITLE[category]}
      </h2>
      <div className="space-y-1.5">
        {items.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            claims={claims}
            comments={comments}
            participants={participants}
            me={me}
          />
        ))}
      </div>
    </section>
  )
}
