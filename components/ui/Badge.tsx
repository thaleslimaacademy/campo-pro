import { T } from '@/lib/theme'

// color deve ser hex (#RRGGBB) para gerar fundo/borda com alfa.
export default function Badge({ label, color = T.green }: { label: string; color?: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}1f`, border: `1px solid ${color}40`, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {label}
    </span>
  )
}
