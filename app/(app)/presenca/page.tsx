'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444' }
const SYNE = 'Syne, sans-serif'

type Atleta = { id: string; nome: string; posicao: string | null; turmaId: string | null }
type Turma = { id: string; nome: string; modalidade: string }

export default function Presenca() {
  const { escolaId } = usePerfil()
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [presencas, setPresencas] = useState<Record<string, 'PRESENTE' | 'AUSENTE'>>({})
  const [treinoId, setTreinoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaSel, setTurmaSel] = useState<string>('todas')

  const hoje = new Date().toISOString().split('T')[0]
  const [dataSel, setDataSel] = useState(hoje)

  useEffect(() => {
    if (!escolaId) return
    async function carregar() {
      setLoading(true)
      const { data: turmasData } = await supabase.from('Turma').select('id, nome, modalidade').eq('escolaId', escolaId!).eq('ativa', true).order('nome')
      setTurmas(turmasData || [])
      const { data: atletasData } = await supabase.from('Atleta').select('id, nome, posicao, turmaId').eq('escolaId', escolaId!).eq('ativo', true).order('nome')
      setAtletas(atletasData || [])

      const dataISO = dataSel + 'T00:00:00.000Z'
      const dataFim = dataSel + 'T23:59:59.999Z'
      let { data: treino } = await supabase.from('Treino').select('id').eq('escolaId', escolaId!).gte('data', dataISO).lte('data', dataFim).limit(1).maybeSingle()
      if (!treino) {
        const { data: novoTreino } = await supabase.from('Treino').insert({ id: crypto.randomUUID(), escolaId: escolaId!, data: dataISO }).select('id').single()
        treino = novoTreino
      }
      if (treino) {
        setTreinoId(treino.id)
        const { data: presencasData } = await supabase.from('Presenca').select('atletaId, status').eq('treinoId', treino.id)
        const map: Record<string, 'PRESENTE' | 'AUSENTE'> = {}
        presencasData?.forEach((p: any) => { map[p.atletaId] = p.status })
        setPresencas(map)
      }
      setLoading(false)
    }
    carregar()
  }, [escolaId, dataSel])

  async function marcar(atletaId: string, status: 'PRESENTE' | 'AUSENTE') {
    if (!treinoId) return
    setSalvando(atletaId)
    if (presencas[atletaId]) {
      await supabase.from('Presenca').update({ status }).eq('atletaId', atletaId).eq('treinoId', treinoId)
    } else {
      await supabase.from('Presenca').insert({ id: crypto.randomUUID(), atletaId, treinoId, status })
    }
    setPresencas(prev => ({ ...prev, [atletaId]: status }))
    setSalvando(null)
  }

  const atletasFiltrados = turmaSel === 'todas' ? atletas : atletas.filter(a => a.turmaId === turmaSel)
  const presentes = Object.values(presencas).filter(s => s === 'PRESENTE').length
  const ausentes = Object.values(presencas).filter(s => s === 'AUSENTE').length
  const marcados = Object.keys(presencas).length
  const pct = atletasFiltrados.length > 0 ? Math.round((presentes / atletasFiltrados.length) * 100) : 0
  const iniciais = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* HEADER */}
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Elenco</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Presença</div>
          </div>
          <input type="date" value={dataSel} max={hoje} onChange={e => { setDataSel(e.target.value); setPresencas({}) }}
            style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', borderRadius: 8, padding: '8px 12px', color: T.text, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
      </div>

      {/* STATS STRIP */}
      {!loading && (
        <div style={{ display: 'flex', background: '#080C15', borderBottom: `1px solid ${T.border}` }}>
          {[
            { label: 'Presentes', valor: String(presentes), color: T.green },
            { label: 'Ausentes', valor: String(ausentes), color: T.red },
            { label: 'Taxa', valor: pct + '%', color: pct >= 75 ? T.green : pct > 0 ? '#FFD700' : T.muted },
            { label: 'Marcados', valor: `${marcados}/${atletasFiltrados.length}`, color: T.accent },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ flex: 1, padding: '13px 0 11px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.valor}</div>
              <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* BARRA PROGRESSO */}
      {!loading && atletasFiltrados.length > 0 && (
        <div style={{ padding: '10px 20px 4px' }}>
          <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: T.primary, width: pct + '%', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* FILTRO TURMA */}
      {!loading && turmas.length > 0 && (
        <div style={{ padding: '10px 20px 8px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            {[{ id: 'todas', nome: 'Todos' }, ...turmas].map(t => (
              <button key={t.id} onClick={() => setTurmaSel(t.id)}
                style={{ padding: '5px 13px', borderRadius: 20, border: `1px solid ${turmaSel === t.id ? T.primary : T.border}`, background: turmaSel === t.id ? `${T.primary}22` : 'transparent', color: turmaSel === t.id ? T.primary : T.muted, fontSize: 11, fontFamily: SYNE, fontWeight: turmaSel === t.id ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.nome}</button>
            ))}
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontSize: 13 }}>Carregando...</div>}

      {/* LISTA */}
      <div style={{ padding: '8px 20px' }}>
        {atletasFiltrados.map(atleta => {
          const status = presencas[atleta.id]
          const isSalvando = salvando === atleta.id
          return (
            <div key={atleta.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: status === 'PRESENTE' ? `${T.green}18` : status === 'AUSENTE' ? `${T.red}18` : T.surface, border: `1.5px solid ${status === 'PRESENTE' ? T.green + '44' : status === 'AUSENTE' ? T.red + '44' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, fontSize: 12, color: status === 'PRESENTE' ? T.green : status === 'AUSENTE' ? T.red : T.muted }}>
                  {iniciais(atleta.nome)}
                </div>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>{atleta.nome}</p>
                  <p style={{ fontSize: 10, color: T.muted, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{atleta.posicao || 'Sem posição'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => marcar(atleta.id, 'PRESENTE')} disabled={isSalvando}
                  style={{ width: 40, height: 40, borderRadius: 8, border: `1.5px solid ${status === 'PRESENTE' ? T.green : T.border}`, cursor: 'pointer', background: status === 'PRESENTE' ? T.green : 'transparent', color: status === 'PRESENTE' ? '#000' : T.muted, fontWeight: 900, fontSize: 14, fontFamily: SYNE, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-check" style={{ fontSize: 16 }} aria-hidden="true"></i>
                </button>
                <button onClick={() => marcar(atleta.id, 'AUSENTE')} disabled={isSalvando}
                  style={{ width: 40, height: 40, borderRadius: 8, border: `1.5px solid ${status === 'AUSENTE' ? T.red : T.border}`, cursor: 'pointer', background: status === 'AUSENTE' ? T.red : 'transparent', color: status === 'AUSENTE' ? '#fff' : T.muted, fontWeight: 900, fontSize: 14, fontFamily: SYNE, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true"></i>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', borderTop: `1px solid ${T.border}`, background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[{ href: '/dashboard', label: 'Início', icon: 'ti-home' }, { href: '/atletas', label: 'Atletas', icon: 'ti-users' }, { href: '/presenca', label: 'Presença', icon: 'ti-check', active: true }, { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' }].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: (item as any).active ? T.primary : T.muted }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 700, color: (item as any).active ? T.primary : T.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.label}</span>
            {(item as any).active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.primary }} />}
          </a>
        ))}
      </nav>
    </div>
  )
}
