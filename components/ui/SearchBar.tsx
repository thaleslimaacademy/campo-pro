'use client'
import { T, INTER } from '@/lib/theme'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ padding: '10px 18px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 14px' }}>
        <i className="ti ti-search" style={{ fontSize: 16, color: T.muted }} aria-hidden="true"></i>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, fontFamily: INTER }}
        />
      </div>
    </div>
  )
}
