'use client'
import { useEffect, useState, useTransition } from 'react'
import { T, SYNE, INTER } from '@/lib/theme'
import SearchBar from '@/components/ui/SearchBar'
import { getAtletasComTurmas } from './actions'

type Atleta = {
  id: string; nome: string; posicao: string | null; fotoUrl: string | null
  bolsista: boolean | null; dataNascimento: string | null; turmaId: string | null
  ativo: boolean; diaVencimento: number | null; valorMensalidade: number | null
  planoMensalidade: string | null; responsavelNome: string | null
}
type Turma = { id: string; nome: string }
type Modo = 'lista' | 'grade'
type Filtro = 'todos' | 'pagantes' | 'bolsistas'

const ACOES = [
  { key: 'perfil',      label: 'Ver perfil',    icon: '👤', href: (id: string) => `/atletas/${id}` },
  { key: 'editar',      label: 'Editar',         icon: '✏️', href: (id: string) => `/atletas/${id}/editar` },
  { key: 'presenca',    label: 'Presença',        icon: '✅', href: (id: string) => `/presenca?atleta=${id}` },
  { key: 'cobranca',    label: 'Gerar cobrança',  icon: '💰', href: (id: string) => `/atletas/${id}#cobranca` },
  { key: 'carteirinha', label: 'Carteirinha',     icon: '🪪', href: (id: string) => `/atletas/${id}/carteirinha` },
  { key: 'whatsapp',    label: 'WhatsApp pai',    icon: '📲', href: null },
]

export default function Atletas() {
  const [atletas, setAtletas]   = useState<Atleta[]>([])
  const [turmaMap, setTurmaMap] = useState<Map<string, string>>(new Map())
  const [busca, setBusca]       = useState('')
  const [modo, setModo]         = useState<Modo>('lista')
  const [filtro, setFiltro]     = useState<Filtro>('todos')
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [loading, startLoading] = useTransition()

  useEffect(() => {
    startLoading(async () => {
      const { atletas: a, turmas: t } = await getAtletasComTurmas()
      setAtletas(a as Atleta[])
      setTurmaMap(new Map((t as Turma[]).map(x => [x.id, x.nome])))
    })
  }, [])

  const anoNasc = (d: string | null) => d ? new Date(d + 'T12:00').getFullYear() : null
  const iniciais = (n: string) => n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

  const filtrados = atletas
    .filter(a => filtro === 'todos' ? true : filtro === 'bolsistas' ? a.bolsista : !a.bolsista)
    .filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  function abrirWhatsApp(atletaId: string) {
    // Redireciona para perfil onde está o botão de WhatsApp do responsável
    window.location.href = `/atletas/${atletaId}`
  }

  function CardAtleta({ a }: { a: Atleta }) {
    const turma = a.turmaId ? turmaMap.get(a.turmaId) : null
    const ano   = anoNasc(a.dataNascimento)
    const aberto = menuAberto === a.id

    return (
      <div style={{ background: '#0D1220', border: `1px solid rgba(240,244,255,0.07)`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
        {/* Foto / Iniciais */}
        <div style={{ background: `linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)`, padding: '20px 16px 12px', textAlign: 'center', position: 'relative' }}>
          {a.bolsista && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: '#00D67A', color: '#000', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, fontFamily: SYNE, textTransform: 'uppercase' }}>Bolsista</div>
          )}
          <button onClick={() => setMenuAberto(aberto ? null : a.id)}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⋯
          </button>
          {a.fotoUrl ? (
            <img src={a.fotoUrl} alt={a.nome} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', display: 'block', margin: '0 auto' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontFamily: SYNE, fontWeight: 900, fontSize: 22, color: '#fff' }}>
              {iniciais(a.nome)}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px', textAlign: 'center' }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: '#F0F4FF', margin: '0 0 4px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome.split(' ').slice(0,2).join(' ')}</p>
          <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)', margin: '0 0 6px' }}>{[a.posicao, ano].filter(Boolean).join(' · ')}</p>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {turma && <div style={{ background: 'rgba(65,105,225,0.15)', border: '1px solid rgba(65,105,225,0.3)', borderRadius: 6, padding: '2px 8px', fontSize: 10, color: '#7DD3FC', fontWeight: 700, fontFamily: SYNE }}>{turma}</div>}
            {!a.bolsista && a.diaVencimento && (
              <div style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, padding: '2px 8px', fontSize: 10, color: '#FFD700', fontWeight: 700, fontFamily: SYNE }}>Dia {a.diaVencimento}</div>
            )}
          </div>
          {a.responsavelNome && (
            <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              👤 {a.responsavelNome.split(' ').slice(0, 2).join(' ')}
            </p>
          )}
        </div>

        {/* Ações rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, borderTop: '1px solid rgba(240,244,255,0.06)' }}>
          {[
            { icon: '👤', label: 'Perfil',    href: `/atletas/${a.id}` },
            { icon: '✏️', label: 'Editar',    href: `/atletas/${a.id}/editar` },
            { icon: '🪪', label: 'Carteira',  href: `/atletas/${a.id}/carteirinha` },
          ].map(btn => (
            <a key={btn.label} href={btn.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', background: 'transparent', textDecoration: 'none', borderRight: '1px solid rgba(240,244,255,0.06)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(65,105,225,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 16 }}>{btn.icon}</span>
              <span style={{ fontSize: 9, color: 'rgba(240,244,255,0.4)', fontFamily: SYNE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{btn.label}</span>
            </a>
          ))}
        </div>

        {/* Menu flutuante de mais ações */}
        {aberto && (
          <>
            <div onClick={() => setMenuAberto(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 40, right: 8, zIndex: 50, background: '#0A0E1A', border: '1px solid rgba(240,244,255,0.12)', borderRadius: 10, padding: 8, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              {[
                { icon: '💰', label: 'Gerar cobrança',  href: `/atletas/${a.id}#cobranca` },
                { icon: '✅', label: 'Registrar presença', href: `/presenca?atleta=${a.id}` },
                { icon: '📲', label: 'WhatsApp pai',    href: `/atletas/${a.id}` },
                { icon: '📄', label: 'Documentos',       href: `/atletas/${a.id}/editar` },
                { icon: '📊', label: 'Avaliação física', href: `/atletas/${a.id}/avaliacao` },
              ].map(item => (
                <a key={item.label} href={item.href} onClick={() => setMenuAberto(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', color: '#F0F4FF', textDecoration: 'none', fontSize: 12, borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(65,105,225,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, paddingBottom: 90 }}>

      {/* HEADER */}
      <div style={{ background: T.primary, padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Elenco</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>
              Atletas <span style={{ color: '#00BFFF', fontStyle: 'italic' }}>{atletas.length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/atletas/carteirinhas" style={{ background: 'rgba(255,255,255,0.15)', color: T.text, borderRadius: 8, padding: '9px 12px', fontFamily: SYNE, fontWeight: 700, fontSize: 11, textDecoration: 'none', textTransform: 'uppercase' }}>🪪 Carteirinhas</a>
            <a href="/atletas/importar" style={{ background: 'rgba(255,255,255,0.15)', color: T.text, borderRadius: 8, padding: '9px 12px', fontFamily: SYNE, fontWeight: 700, fontSize: 11, textDecoration: 'none', textTransform: 'uppercase' }}>⬆ CSV</a>
            <a href="/atletas/novo" style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '9px 14px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase' }}>+ Novo</a>
          </div>
        </div>

        {/* Toggle modo */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {(['lista', 'grade'] as Modo[]).map(m => (
            <button key={m} onClick={() => setModo(m)}
              style={{ background: modo === m ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: '5px 12px', color: '#fff', fontSize: 11, fontFamily: SYNE, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>
              {m === 'lista' ? '☰ Lista' : '⊞ Grade'}
            </button>
          ))}
        </div>
      </div>

      {/* STATS + FILTRO */}
      <div style={{ display: 'flex', background: '#080C15', borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'Todos',     valor: atletas.length,                          color: '#00BFFF', key: 'todos' },
          { label: 'Pagantes',  valor: atletas.filter(a => !a.bolsista).length, color: '#00D67A', key: 'pagantes' },
          { label: 'Bolsistas', valor: atletas.filter(a =>  a.bolsista).length, color: '#FFD700', key: 'bolsistas' },
        ].map((s, i, arr) => (
          <button key={s.key} onClick={() => setFiltro(s.key as Filtro)}
            style={{ flex: 1, padding: '13px 0 11px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', background: filtro === s.key ? 'rgba(65,105,225,0.1)' : 'transparent', cursor: 'pointer', border: 'none', borderBottom: filtro === s.key ? `2px solid ${s.color}` : '2px solid transparent' }}>
            <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.valor}</div>
            <div style={{ fontSize: 9, color: filtro === s.key ? s.color : T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>{s.label}</div>
          </button>
        ))}
      </div>

      <SearchBar value={busca} onChange={setBusca} placeholder="Buscar por nome, posição, turma..." />

      {/* CONTEÚDO */}
      <div style={{ padding: '8px 14px 14px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Carregando...</p>}
        {!loading && filtrados.length === 0 && <p style={{ color: T.muted, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Nenhum atleta encontrado.</p>}

        {modo === 'grade' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {filtrados.map(a => <CardAtleta key={a.id} a={a} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrados.map(a => {
              const turma = a.turmaId ? turmaMap.get(a.turmaId) : null
              const ano   = anoNasc(a.dataNascimento)
              return (
                <div key={a.id} style={{ background: '#0D1220', border: '1px solid rgba(240,244,255,0.07)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', position: 'relative' }}>
                  {a.fotoUrl ? (
                    <img src={a.fotoUrl} alt={a.nome} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1A3FA8,#4169E1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                      {iniciais(a.nome)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: '#F0F4FF', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</p>
                    <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
                      {[a.posicao, ano, turma].filter(Boolean).join(' · ')}
                      {!a.bolsista && a.diaVencimento ? (
                        <span style={{ color: '#FFD700', fontWeight: 700 }}>
                          {[a.posicao, ano, turma].filter(Boolean).length > 0 ? ' · ' : ''}Dia {a.diaVencimento}
                        </span>
                      ) : null}
                    </p>
                    {a.responsavelNome && (
                      <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        👤 {a.responsavelNome}
                      </p>
                    )}
                  </div>
                  {a.bolsista && <span style={{ background: '#00D67A20', color: '#00D67A', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, fontFamily: SYNE, textTransform: 'uppercase', flexShrink: 0 }}>Bolsista</span>}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={`/atletas/${a.id}`} style={{ background: 'rgba(65,105,225,0.12)', border: '1px solid rgba(65,105,225,0.25)', color: '#7DD3FC', padding: '6px 10px', borderRadius: 8, fontSize: 12, textDecoration: 'none', fontWeight: 700 }}>👤</a>
                    <a href={`/atletas/${a.id}/editar`} style={{ background: 'rgba(240,244,255,0.06)', border: '1px solid rgba(240,244,255,0.1)', color: T.muted, padding: '6px 10px', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>✏️</a>
                    <a href={`/atletas/${a.id}/carteirinha`} style={{ background: 'rgba(240,244,255,0.06)', border: '1px solid rgba(240,244,255,0.1)', color: T.muted, padding: '6px 10px', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>🪪</a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
