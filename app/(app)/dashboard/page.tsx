'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

const C = {
  bg: '#0F0F1A', surface: '#1A1A2E', surface2: '#16213E',
  orange: '#FF6B00', gold: '#FFD700', green: '#00C896',
  red: '#FF4757', blue: '#4A90D9', text: '#F0F0F0',
  muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const MODULOS_ADMIN = [
  { href: '/atletas',                   label: 'Atletas',        e: '👥', cor: C.blue },
  { href: '/presenca',                  label: 'Presença',       e: '✅', cor: C.green },
  { href: '/turmas',                    label: 'Turmas',         e: '🏃', cor: C.orange },
  { href: '/financeiro/mensalidades',   label: 'Mensalidades',   e: '💳', cor: C.gold },
  { href: '/financeiro/caixa',          label: 'Caixa',          e: '💰', cor: C.green },
  { href: '/financeiro/patrocinadores', label: 'Patrocinadores', e: '🏅', cor: C.gold },
  { href: '/financeiro/boleto',         label: 'Boleto',         e: '📄', cor: C.orange },
  { href: '/fotos',                     label: 'Fotos',          e: '📸', cor: C.gold },
  { href: '/estoque',                   label: 'Loja',           e: '🛍️', cor: C.orange },
  { href: '/campeonato',                label: 'Campeonatos',    e: '🏆', cor: C.gold },
  { href: '/convocacao',                label: 'Convocações',    e: '📣', cor: C.blue },
  { href: '/mensagens',                 label: 'Mensagens',      e: '💬', cor: C.green },
  { href: '/matriculas',                label: 'Matrículas',     e: '📝', cor: C.orange },
  { href: '/configuracoes',             label: 'Config',         e: '⚙️', cor: C.muted },
]

const MODULOS_PROFESSOR = [
  { href: '/atletas',    label: 'Atletas',     e: '👥', cor: C.blue },
  { href: '/presenca',   label: 'Presença',    e: '✅', cor: C.green },
  { href: '/turmas',     label: 'Turmas',      e: '🏃', cor: C.orange },
  { href: '/campeonato', label: 'Campeonatos', e: '🏆', cor: C.gold },
  { href: '/convocacao', label: 'Convocações', e: '📣', cor: C.blue },
]

export default function Dashboard() {
  const { isAdmin, isLoaded, escolaId, role } = usePerfil()
  const MODULOS = role === 'professor' ? MODULOS_PROFESSOR : MODULOS_ADMIN
  const [escola, setEscola] = useState('Gestão FC')
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [pendentes, setPendentes] = useState(0)
  const [presenca, setPresenca] = useState({ p: 0, t: 0 })
  const [pagasV, setPagasV] = useState(0)
  const [loading, setLoading] = useState(true)

  const hoje = new Date()
  const [di] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10))
  const [df] = useState(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10))

  useEffect(() => {
    if (!escolaId) return
    const run = async () => {
      supabase.from('Escola').select('nome').eq('id', escolaId).single().then(({ data }) => { if (data) setEscola(data.nome) })
      supabase.from('Atleta').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('ativo', true).then(({ count }) => setTotalAtletas(count || 0))
      supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE').eq('tipo', 'matricula').then(({ count }) => setPendentes(count || 0))
      supabase.from('Cobranca').select('valor, status').eq('escolaId', escolaId).gte('vencimento', di).lte('vencimento', df).then(({ data }) => {
        const cobs = data || []
        setPagasV(cobs.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0))
        setInadimplentes(cobs.filter(c => c.status === 'VENCIDO').length)
      })
      supabase.from('Treino').select('id').eq('escolaId', escolaId).gte('data', hoje.toISOString().split('T')[0]).limit(1).single().then(({ data: t }) => {
        if (t) supabase.from('Presenca').select('status').eq('treinoId', t.id).then(({ data: p }) => {
          setPresenca({ p: p?.filter(x => x.status === 'PRESENTE').length || 0, t: p?.length || 0 })
        })
      })
      setLoading(false)
    }
    run()
  }, [escolaId])

  const pct = presenca.t > 0 ? Math.round((presenca.p / presenca.t) * 100) : 0
  const dia = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/gestaofc-logo.png" style={{ width: 80, marginBottom: 16, opacity: 0.8 }} alt="logo" onError={e => (e.currentTarget.style.display = 'none')} />
        <p style={{ color: C.muted, fontFamily: INTER, fontSize: 14 }}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: INTER, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, #FF6B00 0%, #1A1A2E 60%, #0F0F1A 100%)`, padding: '20px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,215,0,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,107,0,0.15)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/gestaofc-logo.png" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} alt="logo" onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: -0.3 }}>{escola}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{dia}</div>
            </div>
          </div>
          <UserButton />
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <MetricCard href="/atletas" label="Atletas ativos" value={loading ? '...' : String(totalAtletas)} cor={C.green} icon="👥" sub="cadastrados" />
          <MetricCard href="/financeiro/mensalidades" label="Inadimplentes" value={loading ? '...' : String(inadimplentes)} cor={inadimplentes > 0 ? C.red : C.green} icon="⚠️" sub={inadimplentes > 0 ? 'em atraso' : 'em dia'} alert={inadimplentes > 0} />
          <MetricCard href="/matriculas" label="Pré-matrículas" value={loading ? '...' : String(pendentes)} cor={pendentes > 0 ? C.orange : C.muted} icon="📝" sub="aguardando" alert={pendentes > 0} />
          <MetricCard href="/presenca" label="Presença hoje" value={loading ? '...' : presenca.t === 0 ? '-' : pct + '%'} cor={pct >= 75 ? C.green : pct > 0 ? C.gold : C.muted} icon="✅" sub={presenca.t > 0 ? `${presenca.p} de ${presenca.t}` : 'sem treino'} />
        </div>

        {isAdmin && (
          <a href="/financeiro/caixa" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg, ${C.orange}22, ${C.surface})`, border: `1px solid ${C.orange}44`, borderRadius: 16, padding: '16px 20px', marginTop: 12, textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Receita do mês</div>
              <div style={{ fontFamily: SYNE, fontSize: 26, fontWeight: 800, color: C.orange }}>{loading ? '...' : brl(pagasV)}</div>
            </div>
            <div style={{ fontSize: 36 }}>💰</div>
          </a>
        )}
      </div>

      {/* MÓDULOS */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ fontFamily: SYNE, fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Módulos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {MODULOS.map(m => (
            <a key={m.href} href={m.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 8px', textDecoration: 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.e}</div>
              <span style={{ fontSize: 10, color: C.text, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{m.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* LINK PRÉ-MATRÍCULA */}
      {isAdmin && (
        <div style={{ margin: '20px 16px 0' }}>
          <div style={{ background: `linear-gradient(135deg, ${C.gold}18, ${C.surface})`, border: `1px solid ${C.gold}44`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: C.gold, marginBottom: 4 }}>🔗 Link de Pré-Matrícula</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>gestaofc.com.br/matricula</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigator.clipboard.writeText('https://gestaofc.com.br/matricula').then(() => alert('Copiado!'))}
                style={{ flex: 1, background: C.gold, color: '#1a1400', border: 'none', borderRadius: 10, padding: '10px', fontFamily: SYNE, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                📋 Copiar
              </button>
              <a href="https://gestaofc.com.br/matricula" target="_blank" rel="noreferrer"
                style={{ flex: 1, background: 'transparent', color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 10, padding: '10px', fontFamily: SYNE, fontWeight: 700, fontSize: 12, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                👁️ Ver
              </a>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', zIndex: 50 }}>
        {[
          { href: '/dashboard',        label: 'Início',     e: '🏠', active: true },
          { href: '/atletas',          label: 'Atletas',    e: '👥', active: false },
          { href: '/presenca',         label: 'Presença',   e: '✅', active: false },
          { href: '/financeiro/caixa', label: 'Financeiro', e: '💰', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', minWidth: 60 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: item.active ? `${C.orange}22` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{item.e}</div>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 600, color: item.active ? C.orange : C.muted, letterSpacing: 0.3 }}>{item.label}</span>
            {item.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.orange }} />}
          </a>
        ))}
      </nav>

      <style>{`* { box-sizing: border-box; } a:hover { opacity: 0.85; }`}</style>
    </div>
  )
}

function MetricCard({ href, label, value, cor, icon, sub, alert }: {
  href: string; label: string; value: string; cor: string; icon: string; sub: string; alert?: boolean
}) {
  return (
    <a href={href} style={{ background: alert ? `${cor}12` : '#1A1A2E', border: `1px solid ${alert ? cor + '44' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '16px 14px', textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: 'rgba(240,240,240,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(240,240,240,0.45)', marginTop: 6 }}>{sub}</div>
    </a>
  )
}