'use client'
import PlanoGate from '@/components/PlanoGate'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', gold: '#FFD700' }
const SYNE = 'Syne, sans-serif'
const INP: React.CSSProperties = { width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 8, padding: '11px 14px', color: T.text, fontFamily: 'Inter, sans-serif', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }
const LBL: React.CSSProperties = { fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }

interface Campeonato { id: string; nome: string; formato: string; status: string; dataInicio: string; dataFim: string; descricao: string; createdAt: string }

export default function Campeonatos() {
  const { escolaId } = usePerfil()
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', formato: 'grupos', dataInicio: '', dataFim: '', descricao: '' })

  async function carregar() {
    const { data } = await supabase.from('Campeonato').select('*').eq('escolaId', escolaId!).order('createdAt', { ascending: false })
    setCampeonatos(data || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  async function salvar() {
    if (!form.nome) return alert('Nome obrigatório.')
    setSalvando(true)
    await supabase.from('Campeonato').insert({ escolaId: escolaId!, nome: form.nome, formato: form.formato, dataInicio: form.dataInicio || null, dataFim: form.dataFim || null, descricao: form.descricao, status: 'rascunho' })
    setForm({ nome: '', formato: 'grupos', dataInicio: '', dataFim: '', descricao: '' })
    setShowForm(false)
    await carregar()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este campeonato?')) return
    await supabase.from('CampeonatoJogo').delete().eq('campeonatoId', id)
    await supabase.from('CampeonatoTime').delete().eq('campeonatoId', id)
    await supabase.from('Campeonato').delete().eq('id', id)
    carregar()
  }

  const STATUS_COR: Record<string, { bg: string; color: string; label: string }> = {
    rascunho:   { bg: 'rgba(240,244,255,0.06)', color: T.muted, label: 'Rascunho' },
    inscricoes: { bg: `${T.primary}20`, color: T.primary, label: 'Inscrições' },
    andamento:  { bg: `${T.green}20`, color: T.green, label: 'Em andamento' },
    encerrado:  { bg: 'rgba(255,68,68,0.12)', color: '#FF4444', label: 'Encerrado' },
  }

  return (
    <PlanoGate feature="campeonatos" planoMinimo="PRO">
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Competição</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Campeonatos</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>{showForm ? 'Fechar' : '+ Novo'}</button>
        </div>
      </div>

      {showForm && (
        <div style={{ margin: '16px 20px', background: T.surface, border: `1px solid ${T.primary}33`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.primary, marginBottom: 14, textTransform: 'uppercase' }}>Novo Campeonato</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={LBL}>Nome *</label><input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} style={INP} placeholder="Ex: Copa Verão 2026" /></div>
            <div><label style={LBL}>Formato</label>
              <select value={form.formato} onChange={e => setForm(p => ({ ...p, formato: e.target.value }))} style={INP}>
                <option value="grupos">Fase de Grupos</option><option value="mata-mata">Mata-Mata</option><option value="misto">Grupos + Mata-Mata</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={LBL}>Data início</label><input type="date" value={form.dataInicio} onChange={e => setForm(p => ({ ...p, dataInicio: e.target.value }))} style={INP} /></div>
              <div><label style={LBL}>Data fim</label><input type="date" value={form.dataFim} onChange={e => setForm(p => ({ ...p, dataFim: e.target.value }))} style={INP} /></div>
            </div>
            <div><label style={LBL}>Descrição</label><textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} style={{ ...INP, resize: 'none' }} placeholder="Detalhes..." /></div>
            <button onClick={salvar} disabled={salvando} style={{ background: T.primary, color: T.text, padding: '13px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>{salvando ? 'Salvando...' : 'Criar Campeonato'}</button>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}
        {campeonatos.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="ti ti-trophy" style={{ fontSize: 48, color: T.border, display: 'block', marginBottom: 12 }} aria-hidden="true"></i>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6, textTransform: 'uppercase' }}>Nenhum campeonato</p>
            <p style={{ fontSize: 13, color: T.muted }}>Clique em + Novo para criar</p>
          </div>
        )}
        {campeonatos.map(c => {
          const st = STATUS_COR[c.status] || STATUS_COR.rascunho
          return (
            <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 15, color: T.text, margin: '0 0 4px', textTransform: 'uppercase' }}>{c.nome}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{c.formato === 'grupos' ? 'Fase de Grupos' : c.formato === 'mata-mata' ? 'Mata-Mata' : 'Grupos + Mata-Mata'}</p>
                </div>
                <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{st.label}</span>
              </div>
              {(c.dataInicio || c.dataFim) && (
                <p style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
                  {c.dataInicio ? new Date(c.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : ''}{c.dataFim ? ' → ' + new Date(c.dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/campeonato/${c.id}`} style={{ flex: 1, background: `${T.primary}15`, border: `1px solid ${T.primary}33`, color: T.primary, textAlign: 'center', padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: SYNE, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gerenciar</a>
                <button onClick={() => excluir(c.id)} style={{ background: 'rgba(255,68,68,0.08)', color: '#FF4444', padding: '10px 14px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(255,68,68,0.2)', cursor: 'pointer' }}>
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
