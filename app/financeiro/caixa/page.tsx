'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Plus, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { carregarCaixa, criarReceita, criarDespesa, excluirReceita, excluirDespesa } from './actions'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const mesAtual = () => new Date().toISOString().slice(0, 7)
const CATS_RECEITA = ['BAR', 'EVENTO', 'RIFA', 'OUTRA']
const CATS_DESPESA = ['MATERIAL', 'SALARIO', 'ALUGUEL', 'TRANSPORTE', 'EQUIPAMENTO', 'OUTRA']
const catLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase()
const dataLabel = (d: string) => d?.slice(0, 10).split('-').reverse().join('/')

type Item = { id: string; valor: number; descricao?: string | null; categoria?: string; data?: string; nome?: string }

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1a06, #050505, #111003)', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#39FF14', margin: 0 }}>Caixa</h1>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ background: '#0a0f08', border: '1px solid #2a3a22', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 14 }} />
          {carregando && <span style={{ color: '#9aa', fontSize: 13 }}>Carregando…</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <Tile icon={<DollarSign size={20} />} label="Mensalidades pagas" valor={totalMensal} cor="#39FF14" />
          <Tile icon={<TrendingUp size={20} />} label="Outras receitas" valor={totalRec} cor="#39FF14" />
          <Tile icon={<TrendingDown size={20} />} label="Despesas" valor={totalDesp} cor="#ff5470" />
          <Tile icon={<Wallet size={20} />} label="Saldo do mês" valor={saldo} cor={saldo >= 0 ? '#39FF14' : '#ff5470'} destaque />
        </div>

        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={secTitle}>Entradas</h2>
            <button onClick={() => setShowRec(v => !v)} style={btnAdd}><Plus size={14} /> Nova entrada</button>
          </div>
          {showRec && (
            <div style={formBox}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Campo label="Categoria"><select value={fCat} onChange={e => setFCat(e.target.value)} style={inp}>{CATS_RECEITA.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}</select></Campo>
                <Campo label="Valor (R$)"><input type="number" min={0} step="0.01" value={fValor} onChange={e => setFValor(e.target.value)} placeholder="0,00" style={inp} /></Campo>
                <Campo label="Descrição"><input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Ex: venda bar" style={inp} /></Campo>
                <Campo label="Data"><input type="date" value={fData} onChange={e => setFData(e.target.value)} style={inp} /></Campo>
              </div>
              <button onClick={addReceita} disabled={salvando} style={btnSave}>Salvar entrada</button>
            </div>
          )}
          {mensalidades.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: '#9aa', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mensalidades pagas</p>
              {mensalidades.map(i => <Row key={i.id} label={i.nome ?? '—'} sub={i.descricao ?? ''} valor={i.valor} cor="#39FF14" />)}
            </div>
          )}
          {receitas.length > 0 ? receitas.map(i => (
            <Row key={i.id} label={catLabel(i.categoria ?? 'OUTRA')} sub={i.descricao ?? ''} data={dataLabel(i.data ?? '')} valor={i.valor} cor="#39FF14"
              onDelete={async () => { await excluirReceita(i.id); await carregar() }} />
          )) : mensalidades.length === 0 && <p style={{ color: '#9aa', fontSize: 13 }}>Nenhuma entrada em {mes}.</p>}
        </div>

        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={secTitle}>Saídas (Despesas)</h2>
            <button onClick={() => setShowDesp(v => !v)} style={{ ...btnAdd, background: 'rgba(255,84,112,0.1)', borderColor: '#ff5470', color: '#ff5470' }}><Plus size={14} /> Nova despesa</button>
          </div>
          {showDesp && (
            <div style={formBox}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Campo label="Categoria"><select value={dCat} onChange={e => setDCat(e.target.value)} style={inp}>{CATS_DESPESA.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}</select></Campo>
                <Campo label="Valor (R$)"><input type="number" min={0} step="0.01" value={dValor} onChange={e => setDValor(e.target.value)} placeholder="0,00" style={inp} /></Campo>
                <Campo label="Descrição"><input type="text" value={dDesc} onChange={e => setDDesc(e.target.value)} placeholder="Ex: pagamento professor" style={inp} /></Campo>
                <Campo label="Data"><input type="date" value={dData} onChange={e => setDData(e.target.value)} style={inp} /></Campo>
              </div>
              <button onClick={addDespesa} disabled={salvando} style={{ ...btnSave, background: '#ff5470', color: '#fff' }}>Salvar despesa</button>
            </div>
          )}
          {despesas.length > 0 ? despesas.map(i => (
            <Row key={i.id} label={catLabel(i.categoria ?? 'OUTRA')} sub={i.descricao ?? ''} data={dataLabel(i.data ?? '')} valor={i.valor} cor="#ff5470"
              onDelete={async () => { await excluirDespesa(i.id); await carregar() }} />
          )) : <p style={{ color: '#9aa', fontSize: 13 }}>Nenhuma despesa em {mes}.</p>}
        </div>

      </div>
    </div>
  )
}

function Tile({ icon, label, valor, cor, destaque }: { icon: React.ReactNode; label: string; valor: number; cor: string; destaque?: boolean }) {
  return (
    <div style={{ background: destaque ? 'rgba(57,255,20,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${destaque ? cor : '#1c2418'}`, borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ color: cor, marginBottom: 8 }}>{icon}</div>
      <p style={{ color: '#9aa', fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      <p style={{ color: cor, fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: 0 }}>{brl(valor)}</p>
    </div>
  )
}

function Row({ label, sub, data, valor, cor, onDelete }: { label: string; sub: string; data?: string; valor: number; cor: string; onDelete?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1c2418' }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
        {sub && <span style={{ color: '#9aa', fontSize: 13, marginLeft: 8 }}>{sub}</span>}
        {data && <span style={{ color: '#9aa', fontSize: 12, marginLeft: 8 }}>{data}</span>}
      </div>
      <span style={{ color: cor, fontWeight: 700, fontSize: 14 }}>{brl(valor)}</span>
      {onDelete && <button onClick={onDelete} style={{ background: 'transparent', border: '1px solid #2a3a22', borderRadius: 8, padding: 7, color: '#9aa', cursor: 'pointer', display: 'inline-flex' }}><Trash2 size={14} /></button>}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9aa' }}>{label}{children}</label>
}

const section: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid #1c2418', borderRadius: 16, padding: 20, marginBottom: 20 }
const secTitle: React.CSSProperties = { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#D4AF37', margin: 0 }
const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(57,255,20,0.08)', border: '1px solid #39FF14', color: '#39FF14', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnSave: React.CSSProperties = { marginTop: 12, background: '#39FF14', color: '#04130a', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }
const formBox: React.CSSProperties = { background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a22', borderRadius: 12, padding: 16, marginBottom: 16 }
const inp: React.CSSProperties = { background: '#0a0f08', border: '1px solid #2a3a22', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14 }