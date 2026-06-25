import type { ReactNode } from 'react'
import { T, SYNE } from '@/lib/theme'

export type StatItem = { value: ReactNode; label: string; color?: string }

export default function Stats({ items }: { items: StatItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, padding: '16px 18px 6px' }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: T.surface2, border: `1px solid ${T.borderBlue}`, borderRadius: 12, padding: '12px 10px' }}>
          <div style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 800, color: s.color || T.accent, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginTop: 5 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
