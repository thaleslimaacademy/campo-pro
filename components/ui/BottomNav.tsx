'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePerfil } from '@/lib/usePerfil'
import { T, SYNE } from '@/lib/theme'

const NAV = [
  { href: '/dashboard', label: 'Início', icon: 'ti-home' },
  { href: '/atletas', label: 'Atletas', icon: 'ti-users' },
  { href: '/presenca', label: 'Presença', icon: 'ti-check' },
  { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' },
]
const FINANCEIRO_OK = ['admin', 'superadmin', 'diretor']

export default function BottomNav() {
  const pathname = usePathname()
  const { role } = usePerfil()
  const items = NAV.filter(i => FINANCEIRO_OK.includes(role || '') || !i.href.startsWith('/financeiro'))

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', borderTop: `1px solid ${T.borderBlue}`, background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
      {items.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 21, color: active ? T.primary : T.muted }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 700, color: active ? T.primary : T.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
