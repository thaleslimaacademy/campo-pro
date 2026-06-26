'use client'
import PlanoGate from '@/components/PlanoGate'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A' }
const SYNE = 'Syne, sans-serif'
const INP: React.CSSProperties = { width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 8, padding: '11px 14px', color: T.text, fontFamily: 'Inter, sans-serif', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }
const LBL: React.CSSProperties = { fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }

type Convocacao = { id: string; titulo: string; tipo: string; data: string; horario: string; local: string; descricao: string; status: string }
type Atleta = { id: string; nome: string; fotoUrl: string | null; turmaId: string | null; dataNascimento: string | null }
type Turma = { id: string; nome: string }

export default function Convocacoes() {
  const { escolaId } = usePerfil()
  const [convocacoes, setConvocacoes] = useState<Convocacao[]>([])
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([])
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroNome, setFiltroNome] = useState('')
  const [form, setForm] = useState({ titulo: '', tipo: 'amistoso', data: '', horario: '', local: '', descricao: '' })

  async function carregar() {
    const [{ data: conv }, { data: ats }, { data: tms }] = await Promise.all([
      supabase.from('Convocacao').select('*').eq('escolaId', escolaId!).order('data', { ascending: false }),
      supabase.from('Atleta').select('id, nome, fotoUrl, turmaId, dataNascimento').eq('escolaId', escolaId!).eq('ativo', true).order('nome'),
      supabase.from('Turma').select('id, nome').eq('escolaId', escolaId!).eq('ativa', true).order('nome'),
    ])
    setConvocacoes(conv || [])
    setAtletas(ats || [])
    setTurmas(tms || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  const atletasFiltrados = atletas.filter(a => {
    const matchTurma = filtroTurma === '' || a.turmaId === filtroTurma
    const matchNome = filtroNome === '' || a.nome.toLowerCase().includes(filtroNome.toLowerCase())
    return matchTurma && matchNome
  })

  function toggleAtleta(id: string) { setAtletasSelecionados(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]) }
  function selecionarTodos() { setAtletasSelecionados(atletasSelecionados.length === atletas.length ? [] : atletas.map(a => a.id)) }

  async function salvar() {
    if (!form.titulo || !form.data || !form.horario) return alert('Título, data e horário obrigatórios.')
    if (atletasSelecionados.length === 0) return alert('Selecione pelo menos um atleta.')
    setSalvando(true)
    const { data: conv } = await supabase.from('Convocacao').insert({ escolaId: escolaId!, ...form, status: 'aberta' }).select().single()
    if (conv) await supabase.from('ConvocacaoAtleta').insert(atletasSelecionados.map(atletaId => ({ convocacaoId: conv.id, atletaId, status: 'pendente' })))
    setForm({ titulo: '', tipo: 'amistoso', data: '', horario: '', local: '', descricao: '' })
    setAtletasSelecionados([])
    setShowForm(false)
    await carregar()
    setSalvando(false)
  }

  async function encerrar(id: string) { await supabase.from('Convocacao').update({ status: 'encerrada' }).eq('id', id); carregar() }
  async function excluir(id: string) { if (!confirm('Excluir?')) return; await supabase.from('ConvocacaoAtleta').delete().eq('convocacaoId', id); await supabase.from('Convocacao').delete().eq('id', id); carregar() }

  const TIPO_COR: Record<string, string> = { amistoso: T.primary, 'jogo-treino': '#8B5CF6', campeonato: '#FFD700', treino: T.green }

  return (
    <PlanoGate feature="convocacoes" planoMinimo="PRO">
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Competição</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Convocações</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>{showForm ? 'Fechar' : '+ Nova'}</button>
        </div>
      </div>

      {showForm && (
        <div style={{ margin: '16px 20px', background: T.surface, border: `1px solid ${T.primary}33`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.primary, marginBottom: 14, textTransform: 'uppercase' }}>Nova Convocação</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={LBL}>Título *</label><input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} style={INP} placeholder="Ex: Jogo contra Rivais FC" /></div>
            <div><label style={LBL}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={INP}>
                <option value="amistoso">Amistoso</option><option value="jogo-treino">Jogo-Treino</option>
                <option value="campeonato">Campeonato</option><option value="treino">Treino</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={LBL}>Data *</label><input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} style={INP} /></div>
              <div><label style={LBL}>Horário *</label><input type="time" value={form.horario} onChange={e => setForm(p => ({ ...p, horario: e.target.value }))} style={INP} /></div>
            </div>
            <div><label style={LBL}>Local</label><input value={form.local} onChange={e => setForm(p => ({ ...p, local: e.target.value }))} style={INP} placeholder="Ex: Campo Municipal" /></div>

            <div style={{ background: '#080C15', border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={LBL}>Atletas *</label>
                <button onClick={selecionarTodos} style={{ fontSize: 11, color: T.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {atletasSelecionados.length === atletas.length ? 'Desmarcar todos' : 'Todos'}
                </button>
              </div>
              <input value={filtroNome} onChange={e => setFiltroNome(e.target.value)} style={{ ...INP, marginBottom: 8 }} placeholder="Buscar por nome..." />
              <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)} style={{ ...INP, marginBottom: 8 }}>
                <option value="">Todas as turmas</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {atletasFiltrados.map(a => {
                  const sel = atletasSelecionados.includes(a.id)
                  return (
                    <div key={a.id} onClick={() => toggleAtleta(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: sel ? `${T.primary}20` : 'transparent', border: `1px solid ${sel ? T.primary + '44' : T.border}` }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? T.primary : T.muted}`, background: sel ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff' }} aria-hidden="true"></i>}
                      </div>
                      <span style={{ fontSize: 12, color: T.text, fontWeight: sel ? 700 : 400 }}>{a.nome}</span>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>{atletasSelecionados.length} selecionado(s)</p>
            </div>

            <button onClick={salvar} disabled={salvando} style={{ background: T.primary, color: T.text, padding: '13px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>{salvando ? 'Salvando...' : 'Criar Convocação'}</button>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}
        {convocacoes.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="ti ti-megaphone" style={{ fontSize: 48, color: T.border, display: 'block', marginBottom: 12 }} aria-hidden="true"></i>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6, textTransform: 'uppercase' }}>Nenhuma convocação</p>
            <p style={{ fontSize: 13, color: T.muted }}>Clique em + Nova para criar</p>
          </div>
        )}
        {convocacoes.map(c => {
          const cor = TIPO_COR[c.tipo] || T.primary
          return (
            <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${cor}`, borderRadius: 8, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: T.text, margin: '0 0 4px', textTransform: 'uppercase' }}>{c.titulo}</p>
                  <span style={{ fontSize: 9, fontWeight: 800, color: cor, background: cor + '18', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.tipo}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: c.status === 'aberta' ? `${T.green}18` : T.border, color: c.status === 'aberta' ? T.green : T.muted, textTransform: 'uppercase' }}>{c.status === 'aberta' ? 'Aberta' : 'Encerrada'}</span>
              </div>
              <p style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
                <i className="ti ti-calendar" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true"></i>
                {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {c.horario}
              </p>
              {c.local && <p style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true"></i>{c.local}
              </p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/convocacao/${c.id}`} style={{ flex: 1, background: `${T.primary}15`, border: `1px solid ${T.primary}33`, color: T.primary, textAlign: 'center', padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: SYNE, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ver detalhes</a>
                {c.status === 'aberta' && <button onClick={() => encerrar(c.id)} style={{ background: T.border, color: T.muted, padding: '9px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>Encerrar</button>}
                <button onClick={() => excluir(c.id)} style={{ background: 'rgba(255,68,68,0.08)', color: '#FF4444', padding: '9px 12px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(255,68,68,0.2)', cursor: 'pointer' }}>
                  <i className="ti ti-trash" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', borderTop: `1px solid ${T.border}`, background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[{ href: '/dashboard', label: 'Início', icon: 'ti-home' }, { href: '/atletas', label: 'Atletas', icon: 'ti-users' }, { href: '/presenca', label: 'Presença', icon: 'ti-check' }, { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' }].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: T.muted }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 700, color: T.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
    </PlanoGate>
  )
}
