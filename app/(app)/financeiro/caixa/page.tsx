'use client'
import { useEffect, useState, useCallback } from 'react'
import { Trash2, Plus, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { carregarCaixa, criarReceita, criarDespesa, excluirReceita, excluirDespesa } from './actions'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444' }
const SYNE = 'Syne, sans-serif'
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const mesAtual = () => new Date().toISOString().slice(0, 7)
const CATS_RECEITA = ['BAR', 'EVENTO', 'RIFA', 'OUTRA']
const CATS_DESPESA = ['MATERIAL', 'SALARIO', 'ALUGUEL', 'TRANSPORTE', 'EQUIPAMENTO', 'OUTRA']
const catLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase()
const dataLabel = (d: string) => d?.slice(0, 10).split('-').reverse().join('/')

type Item = { id: string; valor: number; descricao?: string | null; categoria?: string; data?: string; nome?: string }

const INP: React.CSSProperties = { background: '#080C15', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 8, padding: '10px 12px', color: T.text, fontSize: 13, width: '100%' }

export default function CaixaPage() {
  const [mes, setMes] = useState(mesAtual)
  const [mensalidades, setMensalidades] = useState<Item[]>([])
  const [receitas, setReceitas] = useState<Item[]>([])
  const [despesas, setDespesas] = useState<Item[]>([])
  const [carregando, setCarregando] = useState(false)
  const [showRec, setShowRec] = useState(false)
  const [showDesp, setShowDesp] = useState(false)
  const [fValor, setFValor] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fCat, setFCat] = useState('BAR')
  const [fData, setFData] = useState(() => new Date().toISOString().slice(0, 10))
  const [dValor, setDValor] = useState('')
  const [dDesc, setDDesc] = useState('')
  const [dCat, setDCat] = useState('MATERIAL')
  const [dData, setDData] = useState(() => new Date().toISOString().slice(0, 10))
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const d = await carregarCaixa(mes)
      setMensalidades(d.mensalidades as Item[])
      setReceitas(d.receitas as Item[])
      setDespesas(d.despesas as Item[])
    } finally { setCarregando(false) }
  }, [mes])

  useEffect(() => { carregar() }, [carregar])

  const totalMensal = mensalidades.reduce((s, i) => s + i.valor, 0)
  const totalRec = receitas.reduce((s, i) => s + i.valor, 0)
  const totalDesp = despesas.reduce((s, i) => s + i.valor, 0)
  const saldo = totalMensal + totalRec - totalDesp

  const addReceita = async () => {
    if (!fValor) return
    setSalvando(true)
    try { await criarReceita({ valor: Number(fValor), descricao: fDesc, categoria: fCat, data: fData }); setFValor(''); setFDesc(''); setShowRec(false); await carregar() }
    catch (e) { alert((e as Error).message) }
    finally { setSalvando(false) }
  }

  const addDespesa = async () => {
    if (!dValor) return
    setSalvando(true)
    try { await criarDespesa({ valor: Number(dValor), descricao: dDesc, categoria: dCat, data: dData }); setDValor(''); setDDesc(''); setShowDesp(false); await carregar() }
    catch (e) { alert((e as Error).message) }
    finally { setSalvando(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 40 }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* HEADER */}
      <div style={{ background: T.primary, padding: '20px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Financeiro</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Caixa</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', borderRadius: 8, padding: '8px 12px', color: T.text, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
            {carregando && <span style={{ color: 'rgba(240,244,255,0.6)', fontSize: 12 }}>Carregando…</span>}
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'flex', background: '#080C15', borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'Mensalidades', valor: totalMensal, color: T.accent },
          { label: 'Outras receitas', valor: totalRec, color: T.primary },
          { label: 'Despesas', valor: totalDesp, color: T.red },
          { label: 'Saldo', valor: saldo, color: saldo >= 0 ? T.green : T.red },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ flex: 1, padding: '14px 8px 12px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{brl(s.valor).replace('R$\u00a0', 'R$')}</div>
            <div style={{ fontSize: 8, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px' }}>

        {/* ENTRADAS */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.green}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 900, color: T.green, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Entradas</h2>
            <button onClick={() => setShowRec(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${T.green}15`, border: `1px solid ${T.green}44`, color: T.green, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SYNE, textTransform: 'uppercase' }}>
              <Plus size={13} /> Nova entrada
            </button>
          </div>
          {showRec && (
            <div style={{ background: '#080C15', border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Campo label="Categoria"><select value={fCat} onChange={e => setFCat(e.target.value)} style={INP}>{CATS_RECEITA.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}</select></Campo>
                <Campo label="Valor (R$)"><input type="number" min={0} step="0.01" value={fValor} onChange={e => setFValor(e.target.value)} placeholder="0,00" style={INP} /></Campo>
                <Campo label="Descrição"><input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Ex: venda bar" style={INP} /></Campo>
                <Campo label="Data"><input type="date" value={fData} onChange={e => setFData(e.target.value)} style={INP} /></Campo>
              </div>
              <button onClick={addReceita} disabled={salvando} style={{ marginTop: 12, background: T.green, color: '#001A00', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, cursor: 'pointer', fontFamily: SYNE, fontSize: 12, textTransform: 'uppercase' }}>Salvar entrada</button>
            </div>
          )}
          {mensalidades.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ color: T.muted, fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Mensalidades pagas</p>
              {mensalidades.map(i => <Row key={i.id} label={i.nome ?? '—'} sub={i.descricao ?? ''} valor={i.valor} cor={T.green} />)}
            </div>
          )}
          {receitas.length > 0 ? receitas.map(i => (
            <Row key={i.id} label={catLabel(i.categoria ?? 'OUTRA')} sub={i.descricao ?? ''} data={dataLabel(i.data ?? '')} valor={i.valor} cor={T.green}
              onDelete={async () => { await excluirReceita(i.id); await carregar() }} />
          )) : mensalidades.length === 0 && <p style={{ color: T.muted, fontSize: 13 }}>Nenhuma entrada em {mes}.</p>}
        </div>

        {/* DESPESAS */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.red}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 900, color: T.red, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Despesas</h2>
            <button onClick={() => setShowDesp(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,68,68,0.1)', border: `1px solid rgba(255,68,68,0.3)`, color: T.red, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SYNE, textTransform: 'uppercase' }}>
              <Plus size={13} /> Nova despesa
            </button>
          </div>
          {showDesp && (
            <div style={{ background: '#080C15', border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Campo label="Categoria"><select value={dCat} onChange={e => setDCat(e.target.value)} style={INP}>{CATS_DESPESA.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}</select></Campo>
                <Campo label="Valor (R$)"><input type="number" min={0} step="0.01" value={dValor} onChange={e => setDValor(e.target.value)} placeholder="0,00" style={INP} /></Campo>
                <Campo label="Descrição"><input type="text" value={dDesc} onChange={e => setDDesc(e.target.value)} placeholder="Ex: pagamento professor" style={INP} /></Campo>
                <Campo label="Data"><input type="date" value={dData} onChange={e => setDData(e.target.value)} style={INP} /></Campo>
              </div>
              <button onClick={addDespesa} disabled={salvando} style={{ marginTop: 12, background: T.red, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, cursor: 'pointer', fontFamily: SYNE, fontSize: 12, textTransform: 'uppercase' }}>Salvar despesa</button>
            </div>
          )}
          {despesas.length > 0 ? despesas.map(i => (
            <Row key={i.id} label={catLabel(i.categoria ?? 'OUTRA')} sub={i.descricao ?? ''} data={dataLabel(i.data ?? '')} valor={i.valor} cor={T.red}
              onDelete={async () => { await excluirDespesa(i.id); await carregar() }} />
          )) : <p style={{ color: T.muted, fontSize: 13 }}>Nenhuma despesa em {mes}.</p>}
        </div>

      </div>
    </div>
  )
}

function Tile({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  const T2 = { surface: '#0D1220', border: 'rgba(240,244,255,0.08)', muted: 'rgba(240,244,255,0.4)' }
  const brl2 = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
  return (
    <div style={{ background: T2.surface, border: `1px solid ${T2.border}`, borderRadius: 8, padding: '16px 18px' }}>
      <p style={{ color: T2.muted, fontSize: 10, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>{label}</p>
      <p style={{ color: cor, fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>{brl2(valor)}</p>
    </div>
  )
}

function Row({ label, sub, data, valor, cor, onDelete }: { label: string; sub: string; data?: string; valor: number; cor: string; onDelete?: () => void }) {
  const T2 = { border: 'rgba(240,244,255,0.08)', muted: 'rgba(240,244,255,0.4)', surface: '#0D1220' }
  const brl2 = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${T2.border}` }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#F0F4FF' }}>{label}</span>
        {sub && <span style={{ color: T2.muted, fontSize: 12, marginLeft: 8 }}>{sub}</span>}
        {data && <span style={{ color: T2.muted, fontSize: 11, marginLeft: 8 }}>{data}</span>}
      </div>
      <span style={{ color: cor, fontWeight: 800, fontSize: 13, fontFamily: 'Syne, sans-serif' }}>{brl2(valor)}</span>
      {onDelete && <button onClick={onDelete} style={{ background: 'transparent', border: `1px solid ${T2.border}`, borderRadius: 6, padding: 6, color: T2.muted, cursor: 'pointer', display: 'inline-flex' }}><Trash2 size={13} /></button>}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'rgba(240,244,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}{children}</label>
}
