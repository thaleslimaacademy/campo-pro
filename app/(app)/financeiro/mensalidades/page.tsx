'use client'
import { useEffect, useState, useCallback } from 'react'
import { Trash2, RotateCcw, Plus, Loader2, FileText } from 'lucide-react'
import { listarMensalidades, listarAtletas, gerarMensalidades, softDeleteCobranca, restaurarCobranca, excluirDefinitivo, marcarPago, cancelarCobranca } from './actions'
import { gerarRecibo } from '@/lib/gerarRecibo'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444', gold: '#FFD700' }
const SYNE = 'Syne, sans-serif'
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const competenciaLabel = (c: string | null) => { if (!c) return '—'; const [a, m] = c.slice(0, 7).split('-'); return `${MESES[Number(m) - 1]}/${a}` }
const dataBR = (c: string | null) => (c ? c.slice(0, 10).split('-').reverse().join('/') : '—')
const labelStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
const corStatus = (s: string) => ({ PAGO: T.green, PENDENTE: T.gold, VENCIDO: T.red, CANCELADO: '#555' } as Record<string, string>)[s] ?? '#555'

type Cobranca = { id: string; valor: number; status: string; competencia: string | null; vencimento: string | null; descricao: string | null; excluidaEm: string | null; atletaNome?: string | null; atleta?: { nome: string } | null }
const STATUS = [{ key: 'todas', label: 'Todas' }, { key: 'PENDENTE', label: 'Pendentes' }, { key: 'PAGO', label: 'Pagas' }, { key: 'VENCIDO', label: 'Vencidas' }, { key: 'CANCELADO', label: 'Canceladas' }]
const INP: React.CSSProperties = { background: '#080C15', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 8, padding: '10px 12px', color: T.text, fontSize: 13, width: '100%' }

export default function MensalidadesPage() {
  const [filtro, setFiltro] = useState('todas')
  const [verExcluidas, setVerExcluidas] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('status')
    if (s) setFiltro(s)
  }, [])

  const [lista, setLista] = useState<Cobranca[]>([])
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([])
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [atletaId, setAtletaId] = useState('')
  const [quantidade, setQuantidade] = useState(12)
  const [mesInicial, setMesInicial] = useState(() => new Date().toISOString().slice(0, 7))
  const [valor, setValor] = useState(85)
  const [diaVencimento, setDiaVencimento] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [busca, setBusca] = useState('')

  const filtrados = lista.filter(c => {
    if (!busca.trim()) return true
    const b = busca.toLowerCase()
    const nome = (c.atleta?.nome || c.atletaNome || '').toLowerCase()
    const comp = (c.competencia || '').toLowerCase()
    return nome.includes(b) || comp.includes(b)
  })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try { setLista((await listarMensalidades({ status: filtro as never, incluirExcluidas: verExcluidas })) as unknown as Cobranca[]) }
    finally { setCarregando(false) }
  }, [filtro, verExcluidas])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { listarAtletas().then(setAtletas).catch(() => {}) }, [])

  const lancar = async () => {
    if (!atletaId) { alert('Selecione um atleta'); return }
    setSalvando(true)
    try { const r = await gerarMensalidades({ atletaId, quantidade, mesInicial: Number(mesInicial), valor, diaVencimento }); alert(`${r.criadas} mensalidades lançadas`); await carregar() }
    catch (e) { alert('Erro: ' + (e as Error).message) }
    finally { setSalvando(false) }
  }

  const marcar = async (id: string) => { await marcarPago(id); await carregar() }
  const cancelar = async (id: string) => { if (!confirm('Cancelar esta cobrança?')) return; await cancelarCobranca(id); await carregar() }
  const apagar = async (id: string) => { if (!confirm('Apagar da lista?')) return; await softDeleteCobranca(id); await carregar() }
  const restaurar = async (id: string) => { await restaurarCobranca(id); await carregar() }
  const definitivo = async (id: string) => { if (!confirm('Excluir DEFINITIVAMENTE?')) return; await excluirDefinitivo(id); await carregar() }
  const gerarReciboCobranca = (c: Cobranca) => { gerarRecibo({ tipo: 'MENSALIDADE', nome: c.atleta?.nome || c.atletaNome || '—', valor: c.valor, descricao: c.descricao ?? 'Mensalidade', data: c.competencia ? c.competencia.slice(0, 10) : new Date().toISOString().slice(0, 10) }) }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 40 }}>
      <div style={{ background: T.primary, padding: '20px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Financeiro</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Mensalidades</div>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
            {showForm ? 'Fechar' : '+ Lançar'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px' }}>

        {showForm && (
          <div style={{ background: T.surface, border: `1px solid ${T.primary}33`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.primary, marginBottom: 14, textTransform: 'uppercase' }}>Lançar mensalidades</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <Campo label="Atleta">
                <select value={atletaId} onChange={e => setAtletaId(e.target.value)} style={INP}>
                  <option value="">Selecione…</option>
                  {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </Campo>
              <Campo label="Qtd. meses"><input type="number" min={1} max={24} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} style={INP} /></Campo>
              <Campo label="Mês inicial"><input type="month" value={mesInicial} onChange={e => setMesInicial(e.target.value)} style={INP} /></Campo>
              <Campo label="Valor (R$)"><input type="number" min={0} step="0.01" value={valor} onChange={e => setValor(Number(e.target.value))} style={INP} /></Campo>
              <Campo label="Dia vencimento"><input type="number" min={1} max={28} value={diaVencimento} onChange={e => setDiaVencimento(Number(e.target.value))} style={INP} /></Campo>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[3, 6, 10, 12].map(q => (
                <button key={q} onClick={() => setQuantidade(q)} style={{ background: quantidade === q ? T.primary : 'transparent', color: quantidade === q ? T.text : T.primary, border: `1px solid ${T.primary}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>{q} meses</button>
              ))}
            </div>
            <button onClick={lancar} disabled={salvando} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: T.primary, color: T.text, border: 'none', borderRadius: 8, padding: '11px 20px', fontWeight: 800, cursor: 'pointer', fontFamily: SYNE, fontSize: 12, textTransform: 'uppercase', opacity: salvando ? 0.6 : 1 }}>
              {salvando ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Lançar {quantidade} mensalidades
            </button>
          </div>
        )}

        {/* FILTROS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          {STATUS.map(s => (
            <button key={s.key} onClick={() => setFiltro(s.key)} style={{ background: filtro === s.key ? T.primary : 'transparent', color: filtro === s.key ? T.text : T.muted, border: `1px solid ${filtro === s.key ? T.primary : T.border}`, borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</button>
          ))}
          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: T.muted, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={verExcluidas} onChange={e => setVerExcluidas(e.target.checked)} /> Lixeira
          </label>
        </div>

        {/* TABELA */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {carregando
            ? <div style={{ padding: 24, color: T.muted, fontSize: 13 }}>Carregando…</div>
            : lista.length === 0
            ? <div style={{ padding: 24, color: T.muted, fontSize: 13 }}>Nenhuma cobrança encontrada.</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Competência', 'Atleta', 'Valor', 'Vencimento', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: T.muted, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map(c => {
                    const excluida = !!c.excluidaEm
                    return (
                      <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, opacity: excluida ? 0.5 : 1 }}>
                        <td style={{ padding: '12px 16px', color: T.text, fontWeight: 600 }}>{competenciaLabel(c.competencia)}</td>
                        <td style={{ padding: '12px 16px', color: T.text }}>{c.atleta?.nome || c.atletaNome || '—'}</td>
                        <td style={{ padding: '12px 16px', color: T.accent, fontWeight: 800, fontFamily: SYNE }}>{brl(c.valor)}</td>
                        <td style={{ padding: '12px 16px', color: T.muted }}>{dataBR(c.vencimento)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: corStatus(c.status), fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{excluida ? 'Excluída' : labelStatus(c.status)}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                            {!excluida && c.status === 'PAGO' && (
                              <button onClick={() => gerarReciboCobranca(c)} style={ICON_BTN} title="Gerar recibo"><FileText size={14} /></button>
                            )}
                            {excluida ? (
                              <>
                                <button onClick={() => restaurar(c.id)} style={ICON_BTN} title="Restaurar"><RotateCcw size={14} /></button>
                                <button onClick={() => definitivo(c.id)} style={{ ...ICON_BTN, color: T.red }} title="Excluir definitivo"><Trash2 size={14} /></button>
                              </>
                            ) : (
                              <>
                                {(c.status === 'PENDENTE' || c.status === 'VENCIDO') && (
                                  <button onClick={() => marcar(c.id)} style={{ ...ICON_BTN, color: T.green }} title="Marcar pago">✓</button>
                                )}
                                {c.status === 'VENCIDO' && (
                                  <button onClick={() => cancelar(c.id)} style={{ ...ICON_BTN, color: '#fb923c' }} title="Cancelar">✕</button>
                                )}
                                <button onClick={() => apagar(c.id)} style={ICON_BTN} title="Apagar"><Trash2 size={14} /></button>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: 'rgba(240,244,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}{children}</label>
}

const ICON_BTN: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 6, padding: 6, color: 'rgba(240,244,255,0.4)', cursor: 'pointer', display: 'inline-flex' }
