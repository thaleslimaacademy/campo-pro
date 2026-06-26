'use client'
import { useEffect, useState, useTransition } from 'react'
import BottomNav from '@/components/ui/BottomNav'
import { getTurmasComContagem, criarTurma } from './actions'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', sky: '#7DD3FC', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A' }
const SYNE = 'Syne, sans-serif'
const INP: React.CSSProperties = { width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 8, padding: '11px 14px', color: T.text, fontFamily: 'Inter, sans-serif', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }
const LBL: React.CSSProperties = { fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }

type Turma = { id: string; nome: string; modalidade: string; descricao: string | null; diasSemana: string | null; horario: string | null; ativa: boolean; totalAtletas: number }

const MODALIDADES = [
  { slug: 'todas', label: 'Todas' }, { slug: 'futebol', label: 'Futebol' },
  { slug: 'futsal', label: 'Futsal' }, { slug: 'futvolei', label: 'Futvolei' },
  { slug: 'artes-marciais', label: 'Artes Marciais' }, { slug: 'outras', label: 'Outras' },
]

export default function Turmas() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, startLoad] = useTransition()
  const [salvando, startSave] = useTransition()
  const [criando, setCriando] = useState(false)
  const [filtroModal, setFiltroModal] = useState('todas')
  const [form, setForm] = useState({ nome: '', descricao: '', diasSemana: '', horario: '', modalidade: 'futebol' })

  function carregar() {
    startLoad(async () => {
      const data = await getTurmasComContagem()
      setTurmas(data as Turma[])
    })
  }

  useEffect(() => { carregar() }, [])

  function salvar() {
    if (!form.nome) return
    startSave(async () => {
      await criarTurma(form)
      setForm({ nome: '', descricao: '', diasSemana: '', horario: '', modalidade: 'futebol' })
      setCriando(false)
      carregar()
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Gestão</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Turmas <span style={{ color: T.accent, fontStyle: 'italic' }}>{turmas.length}</span></div>
          </div>
          <button onClick={() => setCriando(!criando)} style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>+ Nova</button>
        </div>
      </div>

      {criando && (
        <div style={{ margin: '16px 20px', background: '#0D1220', border: `1px solid ${T.primary}33`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.primary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nova Turma</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={LBL}>Modalidade</label>
              <select value={form.modalidade} onChange={e => setForm(p => ({ ...p, modalidade: e.target.value }))} style={INP}>
                {MODALIDADES.filter(m => m.slug !== 'todas').map(m => <option key={m.slug} value={m.slug}>{m.label}</option>)}
              </select>
            </div>
            <div><label style={LBL}>Nome da turma *</label><input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} style={INP} placeholder="Ex: Sub-10, Iniciante..." /></div>
            <div><label style={LBL}>Dias da semana</label><input value={form.diasSemana} onChange={e => setForm(p => ({ ...p, diasSemana: e.target.value }))} style={INP} placeholder="Ex: Seg, Qua, Sex" /></div>
            <div><label style={LBL}>Horário</label><input value={form.horario} onChange={e => setForm(p => ({ ...p, horario: e.target.value }))} style={INP} placeholder="Ex: 18:00 - 19:00" /></div>
            <div><label style={LBL}>Descrição</label><textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} style={{ ...INP, resize: 'none' }} placeholder="Observações..." /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={salvar} disabled={salvando || !form.nome} style={{ flex: 1, background: T.primary, color: T.text, padding: '13px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', opacity: salvando || !form.nome ? 0.5 : 1, textTransform: 'uppercase' }}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button onClick={() => setCriando(false)} style={{ flex: 1, background: 'transparent', color: T.muted, padding: '13px', borderRadius: 8, fontFamily: SYNE, fontWeight: 700, fontSize: 13, border: `1px solid ${T.border}`, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 20px 8px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
          {MODALIDADES.map(m => (
            <button key={m.slug} onClick={() => setFiltroModal(m.slug)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filtroModal === m.slug ? T.primary : T.border}`, background: filtroModal === m.slug ? `${T.primary}22` : 'transparent', color: filtroModal === m.slug ? T.primary : T.muted, fontSize: 11, fontFamily: SYNE, fontWeight: filtroModal === m.slug ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 20px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}
        {turmas.filter(t => filtroModal === 'todas' || (t.modalidade || 'futebol') === filtroModal).map((t, i) => (
          <a key={t.id} href={`/turmas/${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${T.border}`, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0A0E2A', border: `1px solid ${T.primary}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, fontSize: 11, color: T.primary, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, textTransform: 'uppercase' }}>{t.nome}</div>
              {t.diasSemana && <div style={{ fontSize: 11, color: T.accent, marginTop: 2, fontWeight: 600 }}>{t.diasSemana}{t.horario ? ' · ' + t.horario : ''}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: T.accent, background: `${T.accent}15`, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.modalidade}</span>
              <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{t.totalAtletas} atletas</span>
            </div>
          </a>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
