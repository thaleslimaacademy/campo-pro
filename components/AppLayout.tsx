'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePerfil } from '@/lib/usePerfil'
import AccountButton from '@/components/AccountButton'

const T = {
  bg:      '#0A0E1A',
  primary: '#4169E1',
  accent:  '#00BFFF',
  text:    '#F0F4FF',
  muted:   'rgba(240,244,255,0.35)',
  border:  'rgba(65,105,225,0.12)',
}
const SYNE  = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const NAV = [
  { href: '/dashboard',        label: 'Início',     icon: 'ti-home' },
  { href: '/atletas',          label: 'Atletas',    icon: 'ti-users' },
  { href: '/presenca',         label: 'Presença',   icon: 'ti-check' },
  { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoaded, role } = usePerfil()

  /* ── Loading ── */
  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <div style={{ textAlign: 'center' }}>
        <img
          src="/gestaofc-icon.png"
          alt="GestaoFC"
          style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', display: 'block', margin: '0 auto 16px' }}
        />
        <p style={{ color: T.muted, fontFamily: INTER, fontSize: 12, letterSpacing: '0.08em', margin: 0 }}>
          Verificando acesso…
        </p>
      </div>
    </div>
  )

  /* ── Sem role ── */
  if (!role) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>
          🔒
        </div>
        <h1 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>
          Acesso não autorizado
        </h1>
        <p style={{ color: T.muted, fontFamily: INTER, fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
          Sua conta não tem permissão de acesso ao GestãoFC.
          <br />Entre em contato com o administrador da sua academia.
        </p>
        <AccountButton />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* Conteúdo — cada página tem seu próprio header */}
      <div style={{ paddingBottom: 80 }}>
        {children}
      </div>

      {/* BOTTOM NAV */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,14,26,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 20px',
        zIndex: 50,
      }}>
        {NAV.map(item => {
          const active = pathname === item.href
            || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', minWidth: 64, position: 'relative' }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                  width: 44, height: 40, borderRadius: 10,
                  background: 'rgba(65,105,225,0.12)', border: '1px solid rgba(65,105,225,0.22)',
                }} />
              )}
              <i
                className={`ti ${item.icon}`}
                style={{ fontSize: 22, color: active ? T.accent : T.muted, position: 'relative', zIndex: 1 }}
                aria-hidden="true"
              ></i>
              <span style={{
                fontSize: 9, fontFamily: SYNE, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: active ? T.primary : T.muted,
              }}>
                {item.label}
              </span>
              {active && <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.accent, marginTop: 1 }} />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
