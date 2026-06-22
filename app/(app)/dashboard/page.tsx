'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { usePerfil } from '@/lib/usePerfil'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const MODULOS_ADMIN = [
  { href: '/atletas',                   label: 'Atletas',          icon: 'ti-users',          grupo: 'elenco' },
  { href: '/presenca',                  label: 'Presenca',         icon: 'ti-check',          grupo: 'elenco' },
  { href: '/turmas',                    label: 'Turmas',           icon: 'ti-run',            grupo: 'elenco' },
  { href: '/modalidades',               label: 'Modalidades',      icon: 'ti-ball-football',  grupo: 'elenco' },
  { href: '/locais',                    label: 'Locais',           icon: 'ti-map-pin',        grupo: 'elenco' },
  { href: '/financeiro/dashboard',      label: 'Dashboard',        icon: 'ti-chart-bar',      grupo: 'financeiro' },
  { href: '/financeiro/caixa',          label: 'Caixa',            icon: 'ti-cash',           grupo: 'financeiro' },
  { href: '/financeiro/boleto',         label: 'Boleto',           icon: 'ti-file-invoice',   grupo: 'financeiro' },
  { href: '/financeiro/mensalidades',   label: 'Mensalidades',     icon: 'ti-credit-card',    grupo: 'financeiro' },
  { href: '/financeiro/patrocinadores', label: 'Patrocinadores',   icon: 'ti-building-bank',  grupo: 'financeiro' },
  { href: '/premios',                   label: 'Premiacoes',       icon: 'ti-medal',          grupo: 'comissao' },
  { href: '/convocacao',                label: 'Convocacoes',      icon: 'ti-clipboard-list', grupo: 'comissao' },
  { href: '/treinamentos',              label: 'Treinamentos',     icon: 'ti-chalkboard',     grupo: 'comissao' },
  { href: '/comissao',                  label: 'Comissao Tecnica', icon: 'ti-users-group',    grupo: 'comissao' },
  { href: '/campeonato',                label: 'Campeonatos',      icon: 'ti-trophy',         grupo: 'competicao' },
  { href: '/mensagens',                 label: 'Mensagens',        icon: 'ti-message-circle', grupo: 'outros' },
  { href: '/matriculas',                label: 'Matriculas',       icon: 'ti-clipboard-list', grupo: 'outros' },
  { href: '/fotos',                     label: 'Fotos',            icon: 'ti-photo',          grupo: 'outros' },
  { href: '/estoque',                   label: 'Loja',             icon: 'ti-shopping-bag',   grupo: 'outros' },
  { href: '/atletas/importar',          label: 'Importar',         icon: 'ti-download',       grupo: 'outros' },
  { href: '/configuracoes',             label: 'Config',           icon: 'ti-settings',       grupo: 'outros' },
]

const MODULOS_PROFESSOR = [
  { href: '/atletas',      label: 'Atletas',      icon: 'ti-users',          grupo: 'elenco' },
  { href: '/presenca',     label: 'Presenca',     icon: 'ti-check',          grupo: 'elenco' },
  { href: '/turmas',       label: 'Turmas',       icon: 'ti-run',            grupo: 'elenco' },
  { href: '/campeonato',   label: 'Campeonatos',  icon: 'ti-trophy',         grupo: 'competicao' },
  { href: '/convocacao',   label: 'Convocacoes',  icon: 'ti-clipboard-list', grupo: 'comissao' },
  { href: '/premios',      label: 'Premiacoes',   icon: 'ti-medal',          grupo: 'comissao' },
  { href: '/treinamentos', label: 'Treinamentos', icon: 'ti-chalkboard',     grupo: 'comissao' },
]

const GRUPOS = [
  { key: 'elenco',      label: 'Elenco',           icon: 'ti-users'           },
  { key: 'financeiro',  label: 'Financeiro',        icon: 'ti-wallet'          },
  { key: 'comissao',    label: 'Comissao Tecnica',  icon: 'ti-clipboard-check' },
  { key: 'competicao',  label: 'Competicao',        icon: 'ti-trophy'          },
  { key: 'outros',      label: 'Ferramentas',       icon: 'ti-tool'            },
]

// Paleta balanceada - fundo neutro escuro, azul nos acentos
const C = {
  navy:    '#0D0D0F',
  blue:    '#4169E1',
  cobalt:  '#1A3FA8',
  cyan:    '#00BFFF',
  sky:     '#7DD3FC',
  off:     '#F0F4FF',
  card:    '#141418',
  border:  '#1E1E24',
  muted:   'rgba(240,244,255,0.35)',
  accent:  'rgba(65,105,225,0.15)',
}

export default function Dashboard() {
  const { isAdmin, isLoaded, escolaId, role } = usePerfil()
  const MODULOS = role === 'diretor'
    ? MODULOS_ADMIN.filter(m => m.href !== '/configuracoes' && m.href !== '/atletas/importar')
    : role === 'preparador'
    ? [
        { href: '/atletas',      label: 'Atletas',      icon: 'ti-users',      grupo: 'elenco' },
        { href: '/presenca',     label: 'Presenca',     icon: 'ti-check',      grupo: 'elenco' },
        { href: '/turmas',       label: 'Turmas',       icon: 'ti-run',        grupo: 'elenco' },
        { href: '/treinamentos', label: 'Treinamentos', icon: 'ti-chalkboard', grupo: 'elenco' },
      ]
    : role === 'professor' ? MODULOS_PROFESSOR
    : MODULOS_ADMIN

  const [escola, setEscola] = useState('GestaoFC')
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [pendentes, setPendentes] = useState(0)
  const [presenca, setPresenca] = useState({ p: 0, t: 0 })
  const [pagasV, setPagasV] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({
    elenco: true, financeiro: false, competicao: false, outros: false, comissao: false,
  })

  const hoje = new Date()

  useEffect(() => {
    if (!escolaId) return
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => {
        setEscola(d.escola)
        setTotalAtletas(d.totalAtletas)
        setPendentes(d.matriculasPendentes)
        setPagasV(d.pagasV)
        setInadimplentes(d.inadimplentes)
        setPresenca(d.presenca)
        setLoading(false)
      })
  }, [escolaId])

  const pct = presenca.t > 0 ? Math.round((presenca.p / presenca.t) * 100) : 0
  const dia = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  function toggleGrupo(key: string) {
    setGruposAbertos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.sky, fontFamily: 'Syne, sans-serif', fontSize: 14 }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.navy, color: C.off, fontFamily: 'Inter, sans-serif', paddingBottom: 88 }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)', padding: '20px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,191,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>{escola}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, textTransform: 'capitalize' }}>{dia}</div>
            </div>
          </div>
          <UserButton />
        </div>
        <div style={{ marginTop: 20, position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Visao geral</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1, textTransform: 'uppercase' }}>Sua Academia</div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'flex', background: '#111115', borderBottom: '1px solid #1E1E24' }}>
        {(isAdmin ? [
          { label: 'Atletas',  value: loading ? '...' : String(totalAtletas), color: C.sky },
          { label: 'Receita',  value: loading ? '...' : brl(pagasV).replace('R ','R$'), color: '#4ADE80' },
          { label: 'Presenca', value: loading ? '...' : presenca.t === 0 ? '-' : pct + '%', color: pct >= 75 ? '#4ADE80' : pct > 0 ? '#FBBF24' : C.muted },
          { label: 'Inadimp.', value: loading ? '...' : String(inadimplentes), color: inadimplentes > 0 ? '#FF6B6B' : C.muted },
        ] : [
          { label: 'Presenca', value: loading ? '...' : presenca.t === 0 ? '-' : pct + '%', color: pct >= 75 ? '#4ADE80' : pct > 0 ? '#FBBF24' : C.muted },
          <div key={s.label} style={{ flex: 1, padding: '14px 0 12px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #1E1E24' : 'none' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.sky, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginTop: 4, opacity: 0.7 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ALERTAS */}
      <div style={{ padding: '12px 16px 0' }}>
        {isAdmin && inadimplentes > 0 && (
          <a href="/financeiro/mensalidades?status=VENCIDO" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: '#FF6B6B' }} />
            <span style={{ fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>{inadimplentes} aluno{inadimplentes > 1 ? 's' : ''} inadimplente{inadimplentes > 1 ? 's' : ''}</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#FF6B6B', marginLeft: 'auto' }} />
          </a>
        )}
        {pendentes > 0 && (
          <a href="/matriculas" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
            <i className="ti ti-clipboard-list" style={{ fontSize: 16, color: '#FBBF24' }} />
            <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 700 }}>{pendentes} pre-matricula{pendentes > 1 ? 's' : ''} aguardando</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#FBBF24', marginLeft: 'auto' }} />
          </a>
        )}
      </div>

      {/* RECEITA CARD */}
      {isAdmin && (
        <div style={{ padding: '12px 16px 0' }}>
          <a href="/financeiro/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#141418', border: '1px solid #1E1E24', borderLeft: '3px solid #4169E1', borderRadius: 12, padding: '16px 18px', textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: 9, color: C.sky, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>Receita do mes</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: '#4ADE80', letterSpacing: -1, lineHeight: 1 }}>{loading ? '...' : brl(pagasV)}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(65,105,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chart-bar" style={{ fontSize: 24, color: '#5B7FE8' }} />
            </div>
          </a>
        </div>
      )}

      {/* MODULOS */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Modulos</div>
        {GRUPOS.map(grupo => {
          const itens = MODULOS.filter(m => m.grupo === grupo.key)
          if (itens.length === 0) return null
          const aberto = gruposAbertos[grupo.key]
          return (
            <div key={grupo.key} style={{ marginBottom: 8 }}>
              <div
                onClick={() => toggleGrupo(grupo.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px',
                  background: aberto ? '#1A1F35' : '#111115',
                  borderRadius: aberto ? '12px 12px 0 0' : 12,
                  border: `1px solid ${aberto ? '#2D3A6E' : '#1E1E24'}`,
                  borderBottom: aberto ? '1px solid #1A1F35' : '1px solid #1E1E24',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: aberto ? 'rgba(65,105,225,0.2)' : '#1A1A22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={'ti ' + grupo.icon} style={{ fontSize: 16, color: aberto ? C.cyan : C.sky }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: aberto ? C.off : C.sky, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Syne, sans-serif' }}>{grupo.label}</span>
                </div>
                <i className={'ti ti-chevron-' + (aberto ? 'up' : 'down')} style={{ fontSize: 16, color: aberto ? C.cyan : C.sky, opacity: aberto ? 1 : 0.5 }} />
              </div>
              {aberto && (
                <div style={{ background: '#0D0D0F', border: '1px solid #1E1E24', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '4px 0 8px' }}>
                  {itens.map((m, idx) => (
                    <a key={m.href} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px 11px 58px', textDecoration: 'none', borderBottom: idx < itens.length - 1 ? '1px solid #161618' : 'none' }}>
                      <i className={'ti ' + m.icon} style={{ fontSize: 16, color: '#5B7FE8' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#C8CDD8' }}>{m.label}</span>
                      <i className="ti ti-chevron-right" style={{ fontSize: 13, color: C.border, marginLeft: 'auto' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* LINK PRE-MATRICULA */}
      {(isAdmin || role === 'preparador' || role === 'professor') && (
        <div style={{ margin: '16px 16px 0' }}>
          <div style={{ background: '#141418', border: '1px solid #1E1E24', borderLeft: '3px solid #00BFFF', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 11, color: C.cyan, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Link de Pre-Matricula</div>
            <div style={{ fontSize: 11, color: C.sky, marginBottom: 12, opacity: 0.7 }}>gestaofc.com.br/matricula</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigator.clipboard.writeText('https://gestaofc.com.br/matricula').then(() => alert('Copiado!'))}
                style={{ flex: 1, background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Copiar
              </button>
              <a href="https://gestaofc.com.br/matricula" target="_blank" rel="noreferrer"
                style={{ flex: 1, background: 'transparent', color: C.cyan, border: `1px solid rgba(0,191,255,0.3)`, borderRadius: 8, padding: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ver
              </a>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0A0A0C', borderTop: '1px solid #1A1A22', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', zIndex: 50 }}>
        {[
          { href: '/dashboard',           label: 'Inicio',     icon: 'ti-home',   active: true  },
          { href: '/atletas',             label: 'Atletas',    icon: 'ti-users',  active: false },
          { href: '/presenca',            label: 'Presenca',   icon: 'ti-check',  active: false },
          { href: '/financeiro/dashboard',label: 'Financeiro', icon: 'ti-wallet', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', minWidth: 60 }}>
            <i className={'ti ' + item.icon} style={{ fontSize: 22, color: item.active ? C.cyan : 'rgba(125,211,252,0.3)' }} />
            <span style={{ fontSize: 9, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: item.active ? C.cyan : 'rgba(125,211,252,0.3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.label}</span>
            {item.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.cyan }} />}
          </a>
        ))}
      </nav>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <style>{`* { box-sizing: border-box; } a:hover { opacity: 0.9; }`}</style>
    </div>
  )
}
