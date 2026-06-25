import Link from 'next/link'
import { T, SYNE } from '@/lib/theme'
import Badge from './Badge'

export default function ListRow({
  href,
  fotoUrl,
  initials,
  title,
  subtitle,
  badge,
  badgeColor,
}: {
  href: string
  fotoUrl?: string | null
  initials: string
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
}) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 13, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '11px 13px', textDecoration: 'none' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.cobalt})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
        {fotoUrl ? <img src={fotoUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, letterSpacing: 0.2, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
        )}
      </div>
      {badge && <Badge label={badge} color={badgeColor} />}
      <i className="ti ti-chevron-right" style={{ fontSize: 18, color: T.faint, flexShrink: 0 }} aria-hidden="true"></i>
    </Link>
  )
}
