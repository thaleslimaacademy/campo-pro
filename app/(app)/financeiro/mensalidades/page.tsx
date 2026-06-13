'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, RotateCcw, Plus, Loader2, FileText } from 'lucide-react'
import {
  listarMensalidades, listarAtletas, gerarMensalidades,
  softDeleteCobranca, restaurarCobranca, excluirDefinitivo, marcarPago,
} from './actions'
import { gerarRecibo } from '@/lib/gerarRecibo'

type Cobranca = {
  id: string; valor: number; status: string; competencia: string | null
  vencimento: string | null; descricao: string | null; excluidaEm: string | null
  atleta?: { nome: string } | null
}

const STATUS = [
  { key: 'todas', label: 'Todas' }, { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'PAGO', label: 'Pagas' }, { key: 'VENCIDO', label: 'Vencidas' },
  { key: 'CANCELADO', label: 'Canceladas' },
]
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const competenciaLabel = (c: string | null) => { if (!c) return '—'; const [a, m] = c.slice(0, 7).split('-'); return `${MESES[Number(m) - 1]}/${a}` }
const dataBR = (c: string | null) => (c ? c.slice(0, 10).split('-').reverse().join('/') : '—')
const labelStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
const corStatus = (s: string) => ({ PAGO: '#FF6B00', PENDENTE: '#FFD700', VENCIDO: '#FF4757', CANCELADO: '#888' } as Record<string, string>)[s] ?? '#888'

export default function MensalidadesPage() {
  const [filtro, setFiltro] = useState('todas')
  const [verExcluidas, setVerExcluidas] = useState(false)
  const [lista, setLista] = useState<Cobranca[]>([])
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([])
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [atletaId, setAtletaId] = useState('')
  const [quantidade, setQuantidade] = useState(12)
  const [mesInicial, setMesInicial] = useState(() => new Date().toISOString().slice(0, 7))
  const [valor, setValor] = useState(85)
  const [diaVencimento, setDiaVencimento] = useState(10)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try { setLista((await listarMensalidades({ status: filtro as never, incluirExcluidas: verExcluidas })) as Cobranca[]) }
    finally { setCarregando(false) }
  }, [filtro, verExcluidas])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { listarAtletas().then(setAtletas).catch(() => {}) }, [])

  const lancar = async () => {
    if (!atletaId) { alert('Selecione um atleta'); return }
    setSalvando(true)
    try { const r = await gerarMensalidades({ atletaId, quantidade, mesInicial, valor, diaVencimento }); alert(`${r.criadas} mensalidades lançadas`); await carregar() }
    catch (e) { alert('Erro: ' + (e as Error).message) }
    finally { setSalvando(false) }
  }
  const apagar = async (id: string) => { if (!confirm('Apagar esta cobrança da lista? Vai pra lixeira e pode ser restaurada.')) return; await softDeleteCobranca(id); await carregar() }
  const restaurar = async (id: string) => { await restaurarCobranca(id); await carregar() }
  const definitivo = async (id: string) => { if (!confirm('Excluir DEFINITIVAMENTE? Nao da pra desfazer.')) return; await excluirDefinitivo(id); await carregar() }

  const gerarReciboCobranca = (c: Cobranca) => {
    gerarRecibo({
      tipo: 'MENSALIDADE',
      nome: c.atleta?.nome ?? '—',
      valor: c.valor,
      descricao: c.descricao ?? 'Mensalidade',
      data: c.competencia ? c.competencia.slice(0, 10) : new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F0F1A, #0F0F1A, #111003)', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B00', margin: 0 }}>Mensalidades</h1>
        <p style={{ color: '#9aa', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>Controle mês a mês, lançamento em lote e organização por status</p>

        <div style={card}>
          <h2 style={cardTitle}>Lançar mensalidades</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Campo label="Atleta">
              <select value={atletaId} onChange={e => setAtletaId(e.target.value)} style={input}>
                <option value="">Selecione…</option>
                {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Qtd. de meses"><input type="number" min={1} max={24} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} style={input} /></Campo>
            <Campo label="Mês inicial"><input type="month" value={mesInicial} onChange={e => setMesInicial(e.target.value)} style={input} /></Campo>
            <Campo label="Valor (R$)"><input type="number" min={0} step="0.01" value={valor} onChange={e => setValor(Number(e.target.value))} style={input} /></Campo>
            <Campo label="Dia do vencimento"><input type="number" min={1} max={28} value={diaVencimento} onChange={e => setDiaVencimento(Number(e.target.value))} style={input} /></Campo>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {[3, 6, 10, 12].map(q => <button key={q} onClick={() => setQuantidade(q)} style={chip(quantidade === q)}>{q} meses</button>)}
          </div>
          <button onClick={lancar} disabled={salvando} style={{ ...btnPrimary, opacity: salvando ? 0.6 : 1 }}>
            {salvando ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Lançar {quantidade} mensalidades
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, alignItems: 'center' }}>
          {STATUS.map(s => <button key={s.key} onClick={() => setFiltro(s.key)} style={tab(filtro === s.key)}>{s.label}</button>)}
          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#9aa', fontSize: 13 }}>
            <input type="checkbox" checked={verExcluidas} onChange={e => setVerExcluidas(e.target.checked)} /> Ver excluídas (lixeira)
          </label>
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden', marginTop: 16 }}>
          {carregando ? <div style={{ padding: 24, color: '#9aa' }}>Carregando…</div>
            : lista.length === 0 ? <div style={{ padding: 24, color: '#9aa' }}>Nenhuma cobrança encontrada.</div>
            : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
              <thead><tr style={{ color: '#9aa', textAlign: 'left' }}>
                <th style={th}>Competência</th><th style={th}>Atleta</th><th style={th}>Valor</th><th style={th}>Vencimento</th><th style={th}>Status</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {lista.map(c => {
                  const excluida = !!c.excluidaEm
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid #1A1A2E', opacity: excluida ? 0.5 : 1 }}>
                      <td style={td}>{competenciaLabel(c.competencia)}</td>
                      <td style={td}>{c.atleta?.nome ?? '—'}</td>
                      <td style={td}>{brl(c.valor)}</td>
                      <td style={td}>{dataBR(c.vencimento)}</td>
                      <td style={td}><span style={{ color: corStatus(c.status), fontWeight: 600 }}>{excluida ? 'Excluída' : labelStatus(c.status)}</span></td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {!excluida && c.status === 'PAGO' && (
                            <button
                              onClick={() => gerarReciboCobranca(c)}
                              style={{ ...iconBtn, color: '#FF6B00', borderColor: '#1a3a14' }}
                              title="Gerar recibo PDF"
                            >
                              <FileText size={16} />
                            </button>
                          )}
                          {excluida ? (
                            <>
                              <button onClick={() => restaurar(c.id)} style={iconBtn} title="Restaurar"><RotateCcw size={16} /></button>
                              <button onClick={() => definitivo(c.id)} style={{ ...iconBtn, color: '#FF4757', borderColor: '#5a2230' }} title="Excluir definitivamente"><Trash2 size={16} /></button>
                            </>
                          ) : (
                            <>
                              {(c.status === 'PENDENTE' || c.status === 'VENCIDO') && (
                                <button
                                  onClick={() => marcar(c.id)}
                                  style={{ ...iconBtn, color: '#4ade80', borderColor: '#14532d' }}
                                  title="Marcar como pago"
                                >
                                  ✓
                                </button>
                              )}
                              <button onClick={() => apagar(c.id)} style={iconBtn} title="Apagar da lista"><Trash2 size={16} /></button>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9aa' }}>{label}{children}</label>
}

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A2E', borderRadius: 16, padding: 20, marginTop: 20 }
const cardTitle: React.CSSProperties = { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#FFD700', margin: '0 0 14px' }
const input: React.CSSProperties = { background: '#0a0f08', border: '1px solid #2A2A4A', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14 }
const th: React.CSSProperties = { padding: '14px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }
const td: React.CSSProperties = { padding: '14px 16px' }
const btnPrimary: React.CSSProperties = { marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF6B00', color: '#04130a', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }
const iconBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #2A2A4A', borderRadius: 8, padding: 8, color: '#cdd', cursor: 'pointer', display: 'inline-flex' }

function chip(active: boolean): React.CSSProperties {
  return { background: active ? '#FFD700' : 'transparent', color: active ? '#1a1400' : '#FFD700', border: '1px solid #FFD700', borderRadius: 999, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }
}
function tab(active: boolean): React.CSSProperties {
  return { background: active ? '#FF6B00' : 'rgba(255,255,255,0.04)', color: active ? '#04130a' : '#cdd', border: `1px solid ${active ? '#FF6B00' : '#2A2A4A'}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }
}