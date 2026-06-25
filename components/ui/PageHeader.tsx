'use client'
import Link from 'next/link'
import { T, SYNE } from '@/lib/theme'

export default function PageHeader({
  eyebrow,
  title,
  count,
  actionLabel,
  actionHref,
  actionIcon = 'ti-plus',
}: {
  eyebrow: string
  title: string
  count?: number | string
  actionLabel?: string
  actionHref?: string
  actionIcon?: string
}) {
  return (
    <div style={{ padding: '18px 18px 16px', background: T.surface, borderBottom: `1px solid ${T.borderBlue}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: T.sky, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>{eyebrow}</div>
          <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 27, letterSpacing: -0.5, lineHeight: 1, color: T.text }}>
            {title}
            {count !== undefined && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 30, height: 24, padding: '0 8px', marginLeft: 6, background: 'rgba(65,105,225,0.18)', border: '1px solid rgba(65,105,225,0.35)', borderRadius: 8, fontSize: 14, color: T.sky }}>{count}</span>
            )}
          </div>
        </div>
        {actionLabel && actionHref && (
          <Link href={actionHref} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.primary, color: '#fff', borderRadius: 10, padding: '10px 14px', fontFamily: SYNE, fontWeight: 700, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
            <i className={`ti ${actionIcon}`} style={{ fontSize: 16 }} aria-hidden="true"></i>{actionLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
