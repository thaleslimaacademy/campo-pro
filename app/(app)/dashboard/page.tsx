'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { usePerfil } from '@/lib/usePerfil'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const MODULOS_ADMIN = [
  { href: '/atletas',                   label: 'Atletas',        icon: 'ti-users',          grupo: 'elenco' },
  { href: '/presenca',                  label: 'Presença',       icon: 'ti-check',          grupo: 'elenco' },
  { href: '/turmas',                    label: 'Turmas',         icon: 'ti-run',            grupo: 'elenco' },
  { href: '/premios',                   label: 'Premiações',     icon: 'ti-medal',          grupo: 'comissao' },
  { href: '/modalidades',               label: 'Modalidades',    icon: 'ti-ball-football',  grupo: 'elenco' },
  { href: '/financeiro/caixa',          label: 'Caixa',          icon: 'ti-cash',           grupo: 'financeiro' },
  { href: '/financeiro/boleto',         label: 'Boleto',         icon: 'ti-file-invoice',   grupo: 'financeiro' },
  { href: '/financeiro/mensalidades',   label: 'Mensalidades',   icon: 'ti-credit-card',    grupo: 'financeiro' },
  { href: '/relatorios/fluxo-caixa',   label: 'Fluxo de Caixa', icon: 'ti-chart-line',    grupo: 'financeiro' },
  { href: '/financeiro/patrocinadores', label: 'Patrocinadores', icon: 'ti-building-bank',  grupo: 'financeiro' },
  { href: '/campeonato',                label: 'Campeonatos',    icon: 'ti-trophy',         grupo: 'competicao' },
  { href: '/convocacao',                label: 'Convocações',    icon: 'ti-clipboard-list', grupo: 'comissao' },
  { href: '/mensagens',                 label: 'Mensagens',      icon: 'ti-message-circle', grupo: 'outros' },
  { href: '/matriculas',                label: 'Matrículas',     icon: 'ti-clipboard-list', grupo: 'outros' },
  { href: '/fotos',                     label: 'Fotos',          icon: 'ti-photo',          grupo: 'outros' },
  { href: '/estoque',                   label: 'Loja',           icon: 'ti-shopping-bag',   grupo: 'outros' },
  { href: '/comissao',                  label: 'Comissão Técnica', icon: 'ti-user-star',     grupo: 'comissao' },
  { href: '/locais',                     label: 'Locais',         icon: 'ti-map-pin',        grupo: 'elenco' },
  { href: '/treinamentos',               label: 'Treinamentos',   icon: 'ti-chalkboard',     grupo: 'comissao' },
  { href: '/atletas/importar',          label: 'Importar',       icon: 'ti-download',       grupo: 'outros' },
  { href: '/configuracoes',             label: 'Config',         icon: 'ti-settings',       grupo: 'outros' },
]

const MODULOS_PROFESSOR = [
  { href: '/atletas',    label: 'Atletas',     icon: 'ti-users',        grupo: 'elenco' },
  { href: '/presenca',   label: 'Presença',    icon: 'ti-check',        grupo: 'elenco' },
  { href: '/turmas',     label: 'Turmas',      icon: 'ti-run',          grupo: 'elenco' },
  { href: '/campeonato', label: 'Campeonatos', icon: 'ti-trophy',       grupo: 'competicao' },
  { href: '/convocacao', label: 'Convocações', icon: 'ti-megaphone',    grupo: 'competicao' },
]

const GRUPOS = [
  { key: 'elenco',      label: 'Elenco',      icon: 'ti-users' },
  { key: 'financeiro',  label: 'Financeiro',  icon: 'ti-wallet' },
  { key: 'comissao',    label: 'Comissão Técnica', icon: 'ti-clipboard-check' },
  { key: 'competicao',  label: 'Competição',  icon: 'ti-trophy' },
  { key: 'outros',      label: 'Ferramentas', icon: 'ti-tool' },
]

export default function Dashboard() {
  const { isAdmin, isLoaded, escolaId, role, nome: nomeUsuario } = usePerfil()
  const MODULOS = role === 'diretor'
    ? MODULOS_ADMIN.filter(m => m.href !== '/configuracoes')
    : role === 'preparador'
    ? [
        { href: '/atletas',  label: 'Atletas',  icon: 'ti-users', grupo: 'elenco' },
        { href: '/presenca', label: 'Presença', icon: 'ti-check', grupo: 'elenco' },
        { href: '/turmas',   label: 'Turmas',   icon: 'ti-run',   grupo: 'elenco' },
      ]
    : role === 'professor' ? MODULOS_PROFESSOR
    : MODULOS_ADMIN

  const [escola, setEscola] = useState('Gestão FC')
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [pendentes, setPendentes] = useState(0)
  const [presenca, setPresenca] = useState({ p: 0, t: 0 })
  const [pagasV, setPagasV] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({ elenco: true, financeiro: false, competicao: false, outros: false, comissao: false })

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
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#555', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: '#2B4EFF', padding: '20px 20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>{escola}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, textTransform: 'capitalize' }}>{dia}</div>
            </div>
          </div>
          <UserButton />
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Visão geral</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1, textTransform: 'uppercase' }}>Sua academia</div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'flex', background: '#0A0A0A', borderBottom: '1px solid #141414' }}>
        {[
          { label: 'Atletas', value: loading ? '...' : String(totalAtletas), color: '#5C7CFF' },
          { label: 'Receita', value: loading ? '...' : brl(pagasV).replace('R$\u00a0','R$'), color: '#00D67A' },
          { label: 'Presença', value: loading ? '...' : presenca.t === 0 ? '-' : pct + '%', color: pct >= 75 ? '#00D67A' : pct > 0 ? '#FFD700' : '#555' },
          { label: 'Inadimp.', value: loading ? '...' : String(inadimplentes), color: inadimplentes > 0 ? '#FF4444' : '#555' },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ flex: 1, padding: '14px 0 12px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #141414' : 'none' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ALERTAS */}
      <div style={{ padding: '12px 20px 0' }}>
        {inadimplentes > 0 && (
          <a href="/financeiro/mensalidades?status=VENCIDO" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: '#FF4444' }} aria-hidden="true"></i>
            <span style={{ fontSize: 12, color: '#FF4444', fontWeight: 700 }}>{inadimplentes} aluno{inadimplentes > 1 ? 's' : ''} inadimplente{inadimplentes > 1 ? 's' : ''}</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#FF4444', marginLeft: 'auto' }} aria-hidden="true"></i>
          </a>
        )}
        {pendentes > 0 && (
          <a href="/matriculas" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
            <i className="ti ti-clipboard-list" style={{ fontSize: 16, color: '#FFD700' }} aria-hidden="true"></i>
            <span style={{ fontSize: 12, color: '#FFD700', fontWeight: 700 }}>{pendentes} pré-matrícula{pendentes > 1 ? 's' : ''} aguardando</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#FFD700', marginLeft: 'auto' }} aria-hidden="true"></i>
          </a>
        )}
      </div>

      {/* RECEITA CARD */}
      {isAdmin && (
        <div style={{ padding: '12px 20px 0' }}>
          <a href="/financeiro/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0D0D0D', border: '1px solid #1A1A1A', borderLeft: '3px solid #2B4EFF', borderRadius: 4, padding: '16px 18px', textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, marginBottom: 6 }}>Receita do mês</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: '#00D67A', letterSpacing: -1, lineHeight: 1 }}>{loading ? '...' : brl(pagasV)}</div>
            </div>
            <i className="ti ti-wallet" style={{ fontSize: 28, color: '#1A1A3A' }} aria-hidden="true"></i>
          </a>
        </div>
      )}

      {/* MÓDULOS COM SUBMENUS */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800, marginBottom: 14 }}>Módulos</div>
        {GRUPOS.map(grupo => {
          const itens = MODULOS.filter(m => m.grupo === grupo.key)
          if (itens.length === 0) return null
          const aberto = gruposAbertos[grupo.key]
          return (
            <div key={grupo.key} style={{ marginBottom: 8 }}>
              {/* HEADER DO GRUPO */}
              <div
                onClick={() => toggleGrupo(grupo.key)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: '#0A0A0A', borderRadius: aberto ? '8px 8px 0 0' : 8, border: '1px solid #141414', borderBottom: aberto ? '1px solid #0A0A0A' : '1px solid #141414', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: aberto ? '#2B4EFF18' : '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${grupo.icon}`} style={{ fontSize: 16, color: aberto ? '#5C7CFF' : '#444' }} aria-hidden="true"></i>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: aberto ? '#fff' : '#888', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Syne, sans-serif' }}>{grupo.label}</span>
                </div>
                <i className={`ti ti-chevron-${aberto ? 'up' : 'down'}`} style={{ fontSize: 16, color: aberto ? '#2B4EFF' : '#333' }} aria-hidden="true"></i>
              </div>
              {/* ITENS DO GRUPO */}
              {aberto && (
                <div style={{ background: '#080808', border: '1px solid #141414', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '4px 0 8px' }}>
                  {itens.map((m, idx) => (
                    <a key={m.href} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px 11px 58px', textDecoration: 'none', borderBottom: idx < itens.length - 1 ? '1px solid #0F0F0F' : 'none' }}>
                      <i className={`ti ${m.icon}`} style={{ fontSize: 16, color: '#555' }} aria-hidden="true"></i>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ccc' }}>{m.label}</span>
                      <i className="ti ti-chevron-right" style={{ fontSize: 13, color: '#2A2A2A', marginLeft: 'auto' }} aria-hidden="true"></i>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* LINK PRÉ-MATRÍCULA */}
      {isAdmin && (
        <div style={{ margin: '16px 20px 0' }}>
          <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderLeft: '3px solid #FFD700', borderRadius: 4, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, color: '#FFD700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Link de Pré-Matrícula</div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>gestaofc.com.br/matricula</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigator.clipboard.writeText('https://gestaofc.com.br/matricula').then(() => alert('Copiado!'))}
                style={{ flex: 1, background: '#FFD700', color: '#0A0A00', border: 'none', borderRadius: 6, padding: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Copiar
              </button>
              <a href="https://gestaofc.com.br/matricula" target="_blank" rel="noreferrer"
                style={{ flex: 1, background: 'transparent', color: '#FFD700', border: '1px solid #FFD70033', borderRadius: 6, padding: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ver
              </a>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', zIndex: 50 }}>
        {[
          { href: '/dashboard',        label: 'Início',     icon: 'ti-home',   active: true },
          { href: '/atletas',          label: 'Atletas',    icon: 'ti-users',  active: false },
          { href: '/presenca',         label: 'Presença',   icon: 'ti-check',  active: false },
          { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', minWidth: 60 }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: item.active ? '#2B4EFF' : '#333' }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: item.active ? '#2B4EFF' : '#333', letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.label}</span>
            {item.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2B4EFF' }} />}
          </a>
        ))}
      </nav>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <style>{`* { box-sizing: border-box; } a:hover { opacity: 0.85; }`}</style>
    </div>
  )
}
