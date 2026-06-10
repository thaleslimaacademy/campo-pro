'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

const S = 'Syne, sans-serif'
const I = 'Inter, sans-serif'
const N = '#39FF14'
const G = '#D4AF37'
const M = 'rgba(255,255,255,0.4)'
const SW = 210

const NAV = [
  { href: '/dashboard', label: 'Início', e: '🏠' },
  { href: '/atletas', label: 'Atletas', e: '👥' },
  { href: '/presenca', label: 'Presença', e: '✅' },
  { href: '/turmas', label: 'Turmas', e: '🏃' },
  { href: '/campeonato', label: 'Campeonatos', e: '🏆' },
  { href: '/convocacao', label: 'Convocações', e: '📣' },
  { href: '/mensagens', label: 'Mensagens', e: '💬' },
  { href: '/financeiro', label: 'Financeiro', e: '💰' },
  { href: '/matriculas', label: 'Matrículas', e: '📝' },
  { href: '/configuracoes', label: 'Config', e: '⚙️' },
]

const MODS = [
  { href: '/atletas', label: 'Atletas', e: '👥' },
  { href: '/financeiro/mensalidades', label: 'Mensalidades', e: '💳' },
  { href: '/financeiro/caixa', label: 'Caixa', e: '💰' },
  { href: '/mensagens', label: 'WhatsApp', e: '📱' },
  { href: '/financeiro/patrocinadores', label: 'Patrocinadores', e: '🏅' },
  { href: '/financeiro/boleto', label: 'Boleto', e: '📄' },
  { href: '/campeonato', label: 'Campeonatos', e: '🏆' },
  { href: '/convocacao', label: 'Convocações', e: '📣' },
  { href: '/matriculas', label: 'Matrículas', e: '📝' },
  { href: '/presenca', label: 'Presença', e: '✅' },
  { href: '/configuracoes', label: 'Config', e: '⚙️' },
]

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export default function Dashboard() {
  const { isAdmin, isLoaded, escolaId } = usePerfil()
  const [nomeEscola, setNomeEscola] = useState('GestaoFC')
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [pendentes, setPendentes] = useState(0)
  const [rematriculas, setRematriculas] = useState(0)
  const [presenca, setPresenca] = useState({ presentes: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [mob, setMob] = useState(false)

  const hoje = new Date()
  const [di, setDi] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10))
  const [df, setDf] = useState(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10))
  const [cob, setCob] = useState<{ valor: number; status: string }[]>([])
  const [recs, setRecs] = useState<{ valor: number }[]>([])
  const [desps, setDesps] = useState<{ valor: number }[]>([])

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola').select('nome').eq('id', escolaId).single().then(({ data }) => { if (data) setNomeEscola(data.nome) })
    supabase.from('Atleta').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('ativo', true).then(({ count }) => setTotalAtletas(count || 0))
    supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE').eq('tipo', 'matricula').then(({ count }) => setPendentes(count || 0))
    supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE').eq('tipo', 'rematricula').then(({ count }) => setRematriculas(count || 0))
    supabase.from('Treino').select('id').eq('escolaId', escolaId).gte('data', hoje.toISOString().split('T')[0]).limit(1).single().then(({ data: t }) => {
      if (t) supabase.from('Presenca').select('status').eq('treinoId', t.id).then(({ data: p }) => {
        setPresenca({ presentes: p?.filter(x => x.status === 'PRESENTE').length || 0, total: p?.length || 0 })
      })
    })
    setLoading(false)
  }, [escolaId])

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Cobranca').select('valor, status').eq('escolaId', escolaId).gte('vencimento', di).lte('vencimento', df).then(({ data }) => {
      setCob(data || [])
      setInadimplentes((data || []).filter(c => c.status === 'VENCIDO').length)
    })
    supabase.from('Receita').select('valor').eq('escolaId', escolaId).gte('data', di).lte('data', df).then(({ data }) => setRecs(data || []))
    supabase.from('Despesa').select('valor').eq('escolaId', escolaId).gte('data', di).lte('data', df).then(({ data }) => setDesps(data || []))
  }, [escolaId, di, df])

  const pct = presenca.total > 0 ? Math.round((presenca.presentes / presenca.total) * 100) : 0
  const pagas = cob.filter(c => c.status === 'PAGO')
  const pagasV = pagas.reduce((s, c) => s + Number(c.valor), 0)
  const pendV = cob.filter(c => c.status === 'PENDENTE').reduce((s, c) => s + Number(c.valor), 0)
  const vencV = cob.filter(c => c.status === 'VENCIDO').reduce((s, c) => s + Number(c.valor), 0)
  const cancV = cob.filter(c => c.status === 'CANCELADO').reduce((s, c) => s + Number(c.valor), 0)
  const totalPer = cob.reduce((s, c) => s + Number(c.valor), 0)
  const recV = recs.reduce((s, r) => s + Number(r.valor), 0)
  const despV = desps.reduce((s, d) => s + Number(d.valor), 0)
  const saldo = pagasV + recV - despV

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
      <p style={{ color: M }}>Carregando...</p>
    </div>
  )

  const statsCards = [
    { label: 'Alunos ativos', val: loading ? '...' : totalAtletas, cor: N, bg: 'rgba(57,255,20,0.08)', bd: 'rgba(57,255,20,0.25)', href: '/atletas' },
    { label: 'Inadimplentes', val: loading ? '...' : inadimplentes, cor: inadimplentes > 0 ? '#ff5555' : N, bg: inadimplentes > 0 ? 'rgba(255,50,50,0.08)' : 'rgba(255,255,255,0.03)', bd: inadimplentes > 0 ? 'rgba(255,50,50,0.3)' : 'rgba(255,255,255,0.08)', href: '/financeiro/mensalidades' },
    { label: 'Pré-matrículas', val: loading ? '...' : pendentes, cor: '#ff9f43', bg: 'rgba(255,159,67,0.08)', bd: 'rgba(255,159,67,0.25)', href: '/matriculas' },
    { label: 'Ré-matrículas', val: loading ? '...' : rematriculas, cor: '#54a0ff', bg: 'rgba(84,160,255,0.08)', bd: 'rgba(84,160,255,0.25)', href: '/matriculas' },
    { label: 'Presença hoje', val: loading ? '...' : presenca.total === 0 ? '-' : pct + '%', cor: pct >= 75 ? N : G, bg: 'rgba(255,255,255,0.03)', bd: 'rgba(255,255,255,0.08)', href: '/presenca' },
    { label: 'Receita do mês', val: loading ? '...' : brl(pagasV), cor: G, bg: 'rgba(212,175,55,0.08)', bd: 'rgba(212,175,55,0.25)', href: '/financeiro/caixa' },
  ]

  const quadroMens = [
    { label: 'Valor total no período', count: cob.length, val: totalPer, cor: '#fff' },
    { label: 'A vencer (Pendente)', count: cob.filter(c => c.status === 'PENDENTE').length, val: pendV, cor: G },
    { label: 'Recebido', count: pagas.length, val: pagasV, cor: N },
    { label: 'Vencido', count: cob.filter(c => c.status === 'VENCIDO').length, val: vencV, cor: '#ff5555' },
    { label: 'Cancelado', count: cob.filter(c => c.status === 'CANCELADO').length, val: cancV, cor: M },
  ]

  const quadroCaixa = [
    { label: 'Mensalidades pagas', count: pagas.length, val: pagasV, cor: N },
    { label: 'Outras entradas (bar, etc)', count: recs.length, val: recV, cor: N },
    { label: 'Despesas', count: desps.length, val: despV, cor: '#ff5555' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(160deg, #0a1a06, #050505, #111003)', color: '#fff', fontFamily: I }}>

      {mob && <div onClick={() => setMob(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99 }} />}

      {/* SIDEBAR */}
      <aside className={mob ? 'sidebar open' : 'sidebar'} style={{ width: SW, background: '#060d04', borderRight: '1px solid #1a2a14', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, height: '100vh', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid #1a2a14' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src="/logo-icon.png" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }} alt="logo" onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div style={{ fontFamily: S, fontWeight: 800, fontSize: 12, color: '#F0F0F0', lineHeight: 1.2 }}>{nomeEscola}</div>
              <div style={{ fontSize: 9, color: N, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Pro</div>
            </div>
          </div>
          <UserButton />
        </div>

        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(item => (
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', color: item.href === '/dashboard' ? N : 'rgba(255,255,255,0.6)', background: item.href === '/dashboard' ? 'rgba(57,255,20,0.07)' : 'transparent', borderLeft: item.href === '/dashboard' ? `3px solid ${N}` : '3px solid transparent', fontSize: 13, fontWeight: item.href === '/dashboard' ? 700 : 400 }}>
              <span>{item.e}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: '1px solid #1a2a14' }}>
          <a href="/logout" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 12 }}>
            🚪 Sair
          </a>
        </div>
      </aside>

      {/* MAIN */}
      <main className="gc-main" style={{ marginLeft: SW, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Mobile header */}
        <div className="gc-mob-hdr" style={{ display: 'none', padding: '10px 16px', background: '#060d04', borderBottom: '1px solid #1a2a14', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMob(!mob)} style={{ background: 'transparent', border: 'none', color: N, fontSize: 22, cursor: 'pointer' }}>☰</button>
          <span style={{ fontFamily: S, fontWeight: 800, color: N, fontSize: 15 }}>GestaoFC</span>
          <UserButton />
        </div>

        {/* TOP MODULES */}
        <div style={{ background: '#060d04', borderBottom: '1px solid #1a2a14', overflowX: 'auto', display: 'flex', padding: '0 12px' }}>
          {MODS.map(m => (
            <a key={m.href} href={m.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 12px', textDecoration: 'none', color: 'rgba(255,255,255,0.6)', minWidth: 68, borderBottom: '3px solid transparent', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 18 }}>{m.e}</span>
              <span style={{ fontSize: 9, fontFamily: S, fontWeight: 600, letterSpacing: 0.3 }}>{m.label}</span>
            </a>
          ))}
        </div>

        {/* CONTENT */}
        <div className="gc-pad" style={{ padding: '22px 24px', flex: 1 }}>

          {/* STAT CARDS — agora clicáveis */}
          <div className="gc-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 22 }}>
            {statsCards.map(c => (
              <a key={c.label} href={c.href} style={{ background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 14, padding: '14px 12px', textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
                <div style={{ fontSize: 9, color: M, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontFamily: S, fontSize: 22, fontWeight: 800, color: c.cor }}>{c.val}</div>
              </a>
            ))}
          </div>

          {/* DATE RANGE */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: M }}>Período de</span>
              <input type="date" value={di} onChange={e => setDi(e.target.value)} style={{ background: '#0a0f08', border: '1px solid #2a3a22', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12 }} />
              <span style={{ fontSize: 11, color: M }}>à</span>
              <input type="date" value={df} onChange={e => setDf(e.target.value)} style={{ background: '#0a0f08', border: '1px solid #2a3a22', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12 }} />
            </div>
          )}

          {/* QUADROS */}
          {isAdmin && (
            <div className="gc-quadros" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

              {/* Mensalidades */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1c2418', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#0b1a07', padding: '13px 18px', borderBottom: '1px solid #1c2418' }}>
                  <span style={{ fontFamily: S, fontWeight: 700, fontSize: 13, color: N }}>💳 Quadro de Mensalidades</span>
                </div>
                <div style={{ padding: '0 18px' }}>
                  {quadroMens.map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #151e11' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                        <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '1px 7px', fontSize: 9, color: M }}>({row.count})</span>
                      </div>
                      <span style={{ fontFamily: S, fontWeight: 700, color: row.cor, fontSize: 12 }}>{brl(row.val)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #151e11' }}>
                    <span style={{ fontFamily: S, fontWeight: 700, fontSize: 11, color: N }}>TOTAL RECEBIDO</span>
                    <span style={{ fontFamily: S, fontWeight: 800, color: N, fontSize: 13 }}>{brl(pagasV)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                    <span style={{ fontFamily: S, fontWeight: 700, fontSize: 11, color: '#ff5555' }}>TOTAL VENCIDO</span>
                    <span style={{ fontFamily: S, fontWeight: 800, color: '#ff5555', fontSize: 13 }}>{brl(vencV)}</span>
                  </div>
                </div>
              </div>

              {/* Caixa */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1c2418', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#0b1a07', padding: '13px 18px', borderBottom: '1px solid #1c2418' }}>
                  <span style={{ fontFamily: S, fontWeight: 700, fontSize: 13, color: G }}>💰 Quadro de Caixa</span>
                </div>
                <div style={{ padding: '0 18px' }}>
                  {quadroCaixa.map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #151e11' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                        <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '1px 7px', fontSize: 9, color: M }}>({row.count})</span>
                      </div>
                      <span style={{ fontFamily: S, fontWeight: 700, color: row.cor, fontSize: 12 }}>{brl(row.val)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #151e11' }}>
                    <span style={{ fontFamily: S, fontWeight: 700, fontSize: 11, color: G }}>TOTAL ENTRADAS</span>
                    <span style={{ fontFamily: S, fontWeight: 800, color: G, fontSize: 13 }}>{brl(pagasV + recV)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
                    <span style={{ fontFamily: S, fontWeight: 700, fontSize: 11, color: saldo >= 0 ? N : '#ff5555' }}>SALDO DO PERÍODO</span>
                    <span style={{ fontFamily: S, fontWeight: 800, color: saldo >= 0 ? N : '#ff5555', fontSize: 13 }}>{brl(saldo)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LINK PRÉ-MATRÍCULA */}
          {isAdmin && (
            <div style={{ marginTop: 20, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: S, fontWeight: 700, fontSize: 14, color: G, marginBottom: 4 }}>🔗 Link de Pré-Matrícula</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>gestaofc.com.br/matricula</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { navigator.clipboard.writeText('https://gestaofc.com.br/matricula'); alert('Link copiado!') }}
                  style={{ background: G, color: '#1a1400', border: 'none', borderRadius: 10, padding: '10px 18px', fontFamily: S, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  📋 Copiar link
                </button>
                <a href="https://gestaofc.com.br/matricula" target="_blank" rel="noreferrer"
                  style={{ background: 'transparent', color: G, border: `1px solid ${G}`, borderRadius: 10, padding: '10px 18px', fontFamily: S, fontWeight: 700, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  👁️ Visualizar
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .sidebar { transition: left 0.28s; }
        @media (max-width: 768px) {
          .sidebar { left: -${SW}px !important; }
          .sidebar.open { left: 0 !important; }
          .gc-main { margin-left: 0 !important; }
          .gc-mob-hdr { display: flex !important; }
          .gc-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .gc-quadros { grid-template-columns: 1fr !important; }
          .gc-pad { padding: 14px !important; }
        }
      `}</style>
    </div>
  )
}