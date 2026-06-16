'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePerfil } from '@/lib/usePerfil'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import AccountButton from '@/components/AccountButton'

const C = {
  bg: '#0F0F1A', surface: '#1A1A2E', orange: '#FF6B00',
  gold: '#FFD700', green: '#00C896', text: '#F0F0F0',
  muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const NAV = [
  { href: '/dashboard',        label: 'Início',     e: '🏠' },
  { href: '/atletas',          label: 'Atletas',    e: '👥' },
  { href: '/presenca',         label: 'Presença',   e: '✅' },
  { href: '/financeiro/caixa', label: 'Financeiro', e: '💰' },
]

const TITULO: Record<string, string> = {
  '/atletas':                   'Atletas',
  '/presenca':                  'Presença',
  '/turmas':                    'Turmas',
  '/campeonato':                'Campeonatos',
  '/convocacao':                'Convocações',
  '/mensagens':                 'Mensagens',
  '/matriculas':                'Matrículas',
  '/configuracoes':             'Configurações',
  '/financeiro/mensalidades':   'Mensalidades',
  '/financeiro/caixa':          'Caixa',
  '/financeiro/patrocinadores': 'Patrocinadores',
  '/financeiro/boleto':         'Boleto',
  '/relatorios':                'Relatórios',
  '/alteracao-massa':           'Alteração em Massa',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoaded, escolaId, role } = usePerfil()
  const [nomeEscola, setNomeEscola] = useState('Gestão FC')

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola').select('nome').eq('id', escolaId).single()
      .then(({ data }) => { if (data) setNomeEscola(data.nome) })
  }, [escolaId])


  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.muted, fontFamily: INTER, fontSize: 13 }}>Verificando acesso...</p>
    </div>
  )

  if (!role) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Acesso não autorizado</h1>
        <p style={{ color: C.muted, fontFamily: INTER, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Sua conta não tem permissão de acesso ao GestãoFC.<br />
          Entre em contato com o administrador da sua academia.
        </p>
        <AccountButton />
      </div>
    </div>
  )

  const isDashboard = pathname === '/dashboard'
  const titulo = TITULO[pathname] ?? TITULO[Object.keys(TITULO).find(k => pathname.startsWith(k)) ?? ''] ?? ''

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: INTER }}>

      {/* HEADER */}
      {!isDashboard && (
        <div style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #1A1A2E 60%, #0F0F1A 100%)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/gestaofc-logo.png" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }} alt="logo"
                onError={e => (e.currentTarget.style.display = 'none')} />
            </a>
            <div>
              <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 15, color: '#fff' }}>{titulo || nomeEscola}</div>
              {titulo && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{nomeEscola}</div>}
            </div>
          </div>
          <AccountButton />
        </div>
      )}

      {/* PAGE CONTENT */}
      <div style={{ paddingBottom: 80 }}>
        {children}
      </div>

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', zIndex: 50 }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', minWidth: 60 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? `${C.orange}22` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {item.e}
              </div>
              <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 600, color: active ? C.orange : C.muted, letterSpacing: 0.3 }}>{item.label}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.orange }} />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}