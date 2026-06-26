'use client'

import { usePerfil } from '@/lib/usePerfil'
import AccountButton from '@/components/AccountButton'
import BottomNav from '@/components/ui/BottomNav'
import { T, SYNE, INTER } from '@/lib/theme'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, role } = usePerfil()

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 80, height: 80, borderRadius: 18, objectFit: 'cover', display: 'block', margin: '0 auto 16px' }} />
        <p style={{ color: T.muted, fontFamily: INTER, fontSize: 12, letterSpacing: '0.08em', margin: 0 }}>Verificando acesso…</p>
      </div>
    </div>
  )

  if (!role) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>🔒</div>
        <h1 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Acesso não autorizado</h1>
        <p style={{ color: T.muted, fontFamily: INTER, fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
          Sua conta não tem permissão de acesso ao GestãoFC.<br />
          Entre em contato com o administrador da sua academia.
        </p>
        <AccountButton />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER }}>
      <div style={{ paddingBottom: 80 }}>{children}</div>
      <BottomNav />
    </div>
  )
}
