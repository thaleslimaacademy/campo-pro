'use client'

import { useEffect, useState } from 'react'
import AccountButton from '@/components/AccountButton'
import BottomNav from '@/components/ui/BottomNav'
import { usePerfil } from '@/lib/usePerfil'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const MODULOS_ADMIN = [
  { href: '/atletas',                   label: 'Atletas',            icon: 'ti-users',          grupo: 'elenco' },
  { href: '/turmas',                    label: 'Turmas',             icon: 'ti-run',            grupo: 'elenco' },
  { href: '/categorias',                label: 'Categorias',         icon: 'ti-tag',            grupo: 'elenco' },
  { href: '/presenca',                  label: 'Presença',           icon: 'ti-check',          grupo: 'elenco' },
  { href: '/modalidades',               label: 'Modalidades',        icon: 'ti-ball-football',  grupo: 'elenco' },
  { href: '/locais',                    label: 'Locais de treino',   icon: 'ti-map-pin',        grupo: 'elenco' },
  { href: '/matriculas',                label: 'Pré-matrículas',     icon: 'ti-clipboard-list', grupo: 'matriculas' },
  { href: '/rematriculas',              label: 'Rematrículas',       icon: 'ti-refresh',        grupo: 'matriculas' },
  { href: '/familias',                  label: 'Famílias (irmãos)',  icon: 'ti-users-group',    grupo: 'matriculas' },
  { href: '/financeiro/dashboard',      label: 'Painel financeiro',  icon: 'ti-chart-bar',      grupo: 'financeiro' },
  { href: '/financeiro/mensalidades',   label: 'Mensalidades',       icon: 'ti-credit-card',    grupo: 'financeiro' },
  { href: '/financeiro/valores',        label: 'Planos e Valores',   icon: 'ti-currency-real',  grupo: 'financeiro' },
  { href: '/financeiro/boleto',         label: 'Boleto',             icon: 'ti-file-invoice',   grupo: 'financeiro' },
  { href: '/financeiro/caixa',          label: 'Caixa',              icon: 'ti-cash',           grupo: 'financeiro' },
  { href: '/financeiro/patrocinadores', label: 'Patrocinadores',     icon: 'ti-building-bank',  grupo: 'financeiro' },
  { href: '/campeonato',                label: 'Campeonatos',        icon: 'ti-trophy',         grupo: 'esportivo' },
  { href: '/convocacao',                label: 'Convocações',        icon: 'ti-clipboard-list', grupo: 'esportivo' },
  { href: '/treinamentos',              label: 'Treinamentos',       icon: 'ti-chalkboard',     grupo: 'esportivo' },
  { href: '/premios',                   label: 'Premiações',         icon: 'ti-medal',          grupo: 'esportivo' },
  { href: '/comissao',                  label: 'Comissão técnica',   icon: 'ti-users-group',    grupo: 'esportivo' },
  { href: '/mensagens',                 label: 'Mensagens',          icon: 'ti-message-circle', grupo: 'comunicacao' },
  { href: '/nps',                       label: 'Pesquisa NPS',       icon: 'ti-mood-happy',     grupo: 'comunicacao' },
  { href: '/estoque',                   label: 'Loja e estoque',     icon: 'ti-shopping-bag',   grupo: 'loja' },
  { href: '/fotos',                     label: 'Fotos',              icon: 'ti-photo',          grupo: 'loja' },
  { href: '/configuracoes',             label: 'Configurações',      icon: 'ti-settings',       grupo: 'config' },
  { href: '/atletas/importar',          label: 'Importar atletas',   icon: 'ti-download',       grupo: 'config' },
]

const MODULOS_PROFESSOR = [
  { href: '/atletas',      label: 'Atletas',      icon: 'ti-users',          grupo: 'elenco' },
  { href: '/presenca',     label: 'Presença',     icon: 'ti-check',          grupo: 'elenco' },
  { href: '/turmas',       label: 'Turmas',       icon: 'ti-run',            grupo: 'elenco' },
  { href: '/campeonato',   label: 'Campeonatos',  icon: 'ti-trophy',         grupo: 'esportivo' },
  { href: '/convocacao',   label: 'Convocações',  icon: 'ti-clipboard-list', grupo: 'esportivo' },
  { href: '/premios',      label: 'Premiações',   icon: 'ti-medal',          grupo: 'esportivo' },
  { href: '/treinamentos', label: 'Treinamentos', icon: 'ti-chalkboard',     grupo: 'esportivo' },
]

const GRUPOS = [
  { key: 'elenco',      label: 'Atletas',        icon: 'ti-users'           },
  { key: 'matriculas',  label: 'Matrículas',     icon: 'ti-clipboard-list'  },
  { key: 'financeiro',  label: 'Financeiro',     icon: 'ti-wallet'          },
  { key: 'esportivo',   label: 'Esportivo',      icon: 'ti-trophy'          },
  { key: 'comunicacao', label: 'Comunicação',    icon: 'ti-message-circle'  },
  { key: 'loja',        label: 'Loja e fotos',   icon: 'ti-shopping-bag'    },
  { key: 'config',      label: 'Configurações',  icon: 'ti-settings'        },
]

// Paleta balanceada - fundo neutro escuro, azul nos acentos
const C = {
  navy:    '#F6F8F7',
  blue:    '#2EA866',
  cobalt:  '#23874F',
  cyan:    '#23874F',
  sky:     '#6B7280',
  off:     '#1F2937',
  card:    '#FFFFFF',
  border:  '#E3E8E5',
  muted:   '#6B7280',
  accent:  '#23874F',
}

export default function Dashboard() {
  const { isAdmin, isLoaded, escolaId, role } = usePerfil()
  const MODULOS = role === 'diretor'
    ? MODULOS_ADMIN.filter(m => m.grupo !== 'config')
    : role === 'preparador'
    ? [
        { href: '/atletas',      label: 'Atletas',      icon: 'ti-users',      grupo: 'elenco' },
        { href: '/presenca',     label: 'Presenca',     icon: 'ti-check',      grupo: 'elenco' },
        { href: '/turmas',       label: 'Turmas',       icon: 'ti-run',        grupo: 'elenco' },
        { href: '/categorias',   label: 'Categorias',   icon: 'ti-tag',        grupo: 'elenco' },
        { href: '/treinamentos', label: 'Treinamentos', icon: 'ti-chalkboard', grupo: 'elenco' },
      ]
    : role === 'professor' ? MODULOS_PROFESSOR
    : MODULOS_ADMIN

  const [escola, setEscola] = useState('GestaoFC')
  const [escolaSlug, setEscolaSlug] = useState('')
  const [isOverride, setIsOverride] = useState(false)
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [pendentes, setPendentes] = useState(0)
  const [presenca, setPresenca] = useState({ p: 0, t: 0 })
  const [pagasV, setPagasV] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({
    elenco: true, matriculas: false, financeiro: false, esportivo: false, comunicacao: false, loja: false, config: false,
  })

  const hoje = new Date()

  useEffect(() => {
    if (!escolaId) return
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => {
        setEscola(d.escola)
        setEscolaSlug(d.escolaSlug || '')
        setIsOverride(d.isOverride || false)
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
      <div style={{ background: '#4169E1', padding: '20px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,191,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>{escola}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, textTransform: 'capitalize' }}>{dia}</div>
            </div>
          </div>
          <AccountButton />
        </div>
        <div style={{ marginTop: 20, position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Visao geral</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1, textTransform: 'uppercase' }}>Sua Academia</div>
        </div>
      </div>

            {/* STATS STRIP */}
      <div style={{ display: 'flex', background: '#FFFFFF', borderBottom: '1px solid #E3E8E5' }}>
        {(isAdmin ? [
          { label: 'Atletas',  value: loading ? '...' : String(totalAtletas), color: C.sky },
          { label: 'Receita',  value: loading ? '...' : brl(pagasV).replace('R ','R$'), color: '#16A34A' },
          { label: 'Presenca', value: loading ? '...' : presenca.t === 0 ? '-' : pct + '%', color: pct >= 75 ? '#16A34A' : pct > 0 ? '#B45309' : C.muted },
          { label: 'Inadimp.', value: loading ? '...' : String(inadimplentes), color: inadimplentes > 0 ? '#DC2626' : C.muted },
        ] : [
          { label: 'Presenca', value: loading ? '...' : presenca.t === 0 ? '-' : pct + '%', color: pct >= 75 ? '#16A34A' : pct > 0 ? '#B45309' : C.muted },
        ]).map((s, i, arr) => (
          <div key={s.label} style={{ flex: 1, padding: '14px 0 12px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #E3E8E5' : 'none' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.sky, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginTop: 4, opacity: 0.7 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ALERTAS */}
      <div style={{ padding: '12px 16px 0' }}>
        {isAdmin && inadimplentes > 0 && (
          <a href="/financeiro/mensalidades" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: '#DC2626' }} />
            <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 700 }}>{inadimplentes} aluno{inadimplentes > 1 ? 's' : ''} inadimplente{inadimplentes > 1 ? 's' : ''}</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#DC2626', marginLeft: 'auto' }} />
          </a>
        )}
        {pendentes > 0 && (
          <a href="/matriculas" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
            <i className="ti ti-clipboard-list" style={{ fontSize: 16, color: '#B45309' }} />
            <span style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>{pendentes} pre-matricula{pendentes > 1 ? 's' : ''} aguardando</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#B45309', marginLeft: 'auto' }} />
          </a>
        )}
      </div>

      {/* RECEITA CARD */}
      {isAdmin && (
        <div style={{ padding: '12px 16px 0' }}>
          <a href="/financeiro/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E3E8E5', borderLeft: '3px solid #2EA866', borderRadius: 12, padding: '16px 18px', textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: 9, color: C.sky, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>Receita do mes</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: '#16A34A', letterSpacing: -1, lineHeight: 1 }}>{loading ? '...' : brl(pagasV)}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(46,168,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chart-bar" style={{ fontSize: 24, color: '#2EA866' }} />
            </div>
          </a>
        </div>
      )}

      {/* MODULOS */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 10, color: '#1F2937', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Modulos</div>
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
                  background: aberto ? '#F3F5F4' : '#FFFFFF',
                  borderRadius: aberto ? '12px 12px 0 0' : 12,
                  border: `1px solid ${aberto ? '#CFE8DA' : '#E3E8E5'}`,
                  borderBottom: aberto ? '1px solid #E3E8E5' : '1px solid #E3E8E5',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: aberto ? 'rgba(46,168,102,0.2)' : '#F3F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={'ti ' + grupo.icon} style={{ fontSize: 16, color: aberto ? C.cyan : C.sky }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: aberto ? C.off : C.sky, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Syne, sans-serif' }}>{grupo.label}</span>
                </div>
                <i className={'ti ti-chevron-' + (aberto ? 'up' : 'down')} style={{ fontSize: 16, color: aberto ? C.cyan : C.sky, opacity: aberto ? 1 : 0.5 }} />
              </div>
              {aberto && (
                <div style={{ background: '#F6F8F7', border: '1px solid #E3E8E5', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '4px 0 8px' }}>
                  {itens.map((m, idx) => (
                    <a key={m.href} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px 11px 58px', textDecoration: 'none', borderBottom: idx < itens.length - 1 ? '1px solid #E3E8E5' : 'none' }}>
                      <i className={'ti ' + m.icon} style={{ fontSize: 16, color: '#2EA866' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{m.label}</span>
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
          <div style={{ background: '#FFFFFF', border: '1px solid #E3E8E5', borderLeft: '3px solid #23874F', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 11, color: C.cyan, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Link de Pre-Matricula</div>
            <div style={{ fontSize: 11, color: C.sky, marginBottom: 12, opacity: 0.7 }}>{escolaSlug ? `gestaofc.com.br/matricula/${escolaSlug}` : 'gestaofc.com.br/matricula'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigator.clipboard.writeText(`https://gestaofc.com.br/matricula/${escolaSlug}`).then(() => alert('Copiado!'))}
                style={{ flex: 1, background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Copiar
              </button>
              <a href={`https://gestaofc.com.br/matricula/${escolaSlug}`} target="_blank" rel="noreferrer"
                style={{ flex: 1, background: 'transparent', color: C.cyan, border: `1px solid rgba(46,168,102,0.3)`, borderRadius: 8, padding: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ver
              </a>
            </div>
          </div>
        </div>
      )}
      <BottomNav />      <style>{`* { box-sizing: border-box; } a:hover { opacity: 0.9; }`}</style>
    </div>
  )
}
