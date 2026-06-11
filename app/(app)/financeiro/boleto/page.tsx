'use client'

import { useEffect, useState } from 'react'
import { FileText, ExternalLink, Copy, CheckCircle, Loader2 } from 'lucide-react'
import { listarAtletasBoleto, gerarBoleto, getCpfResponsavel, salvarCpfResponsavel } from './actions'
import { gerarRecibo } from '@/lib/gerarRecibo'

type Estado = 'form' | 'loading' | 'resultado'

export default function BoletoPage() {
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([])
  const [estado, setEstado] = useState<Estado>('form')
  const [atletaId, setAtletaId] = useState('')
  const [cpf, setCpf] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 5)
    return d.toISOString().slice(0, 10)
  })
  const [descricao, setDescricao] = useState('Mensalidade TLFA')
  const [resultado, setResultado] = useState<{ bankSlipUrl: string; invoiceUrl: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { listarAtletasBoleto().then(setAtletas).catch(() => {}) }, [])

  useEffect(() => {
    if (!atletaId) return
    setCpf('')
    getCpfResponsavel(atletaId).then(c => { if (c) setCpf(c) }).catch(() => {})
  }, [atletaId])

  const atletaNome = atletas.find(a => a.id === atletaId)?.nome ?? ''

  const gerar = async () => {
    if (!atletaId || !cpf || !valor || !vencimento) { setErro('Preencha todos os campos obrigatórios'); return }
    setErro(''); setEstado('loading')
    try {
      const r = await gerarBoleto({ atletaId, cpf, valor: Number(valor), vencimento, descricao })
      setResultado(r)
      setEstado('resultado')
      const salvar = confirm('Salvar CPF para próximas cobranças deste atleta?')
      if (salvar) await salvarCpfResponsavel(atletaId, cpf)
    } catch (e) { setErro((e as Error).message); setEstado('form') }
  }

  const copiar = async () => {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado.bankSlipUrl)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F0F1A, #0F0F1A, #111003)', color: '#fff', padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B00', margin: '0 0 6px' }}>Gerar Boleto</h1>
        <p style={{ color: '#9aa', fontSize: 13, margin: '0 0 28px' }}>Boleto bancário via Asaas</p>

        {estado === 'resultado' && resultado ? (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <CheckCircle size={48} color="#FF6B00" />
              <h2 style={{ fontFamily: 'Syne, sans-serif', color: '#FF6B00', margin: '12px 0 4px' }}>Boleto gerado!</h2>
              <p style={{ color: '#9aa', fontSize: 13 }}>Vencimento: {vencimento.split('-').reverse().join('/')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={resultado.bankSlipUrl} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FF6B00', color: '#04130a', borderRadius: 12, padding: '14px 20px', fontWeight: 700, fontFamily: 'Syne, sans-serif', textDecoration: 'none', fontSize: 15 }}>
                <ExternalLink size={18} /> Abrir Boleto
              </a>
              <button onClick={copiar}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid #FFD700', color: '#FFD700', borderRadius: 12, padding: '12px 20px', fontWeight: 600, cursor: 'pointer' }}>
                {copiado ? <><CheckCircle size={16} /> Copiado!</> : <><Copy size={16} /> Copiar link</>}
              </button>
              <button
                onClick={() => gerarRecibo({ tipo: 'MENSALIDADE', nome: atletaNome, valor: Number(valor), descricao, data: new Date().toISOString().slice(0, 10) })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid #2A2A4A', color: '#cdd', borderRadius: 12, padding: '12px 20px', cursor: 'pointer' }}>
                <FileText size={16} /> Gerar recibo PDF
              </button>
              <button onClick={() => { setEstado('form'); setResultado(null); setValor(''); setCpf('') }}
                style={{ color: '#9aa', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
                Gerar novo boleto
              </button>
            </div>
          </div>
        ) : (
          <div style={card}>
            <Campo label="Atleta *">
              <select value={atletaId} onChange={e => setAtletaId(e.target.value)} style={inp}>
                <option value="">Selecione…</option>
                {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </Campo>
            <Campo label="CPF ou CNPJ do responsável *">
              <input
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                style={inp}
              />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Valor (R$) *">
                <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="85,00" style={inp} />
              </Campo>
              <Campo label="Vencimento *">
                <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} style={inp} />
              </Campo>
            </div>
            <Campo label="Descrição">
              <input value={descricao} onChange={e => setDescricao(e.target.value)} style={inp} />
            </Campo>
            {erro && <p style={{ color: '#FF4757', fontSize: 13, margin: '8px 0 0' }}>{erro}</p>}
            <button onClick={gerar} disabled={estado === 'loading'}
              style={{ marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FF6B00', color: '#04130a', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 700, fontFamily: 'Syne, sans-serif', fontSize: 15, cursor: 'pointer', opacity: estado === 'loading' ? 0.7 : 1 }}>
              {estado === 'loading' ? <><Loader2 size={18} className="spin" /> Gerando…</> : 'Gerar Boleto'}
            </button>
            <p style={{ color: '#9aa', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
              {cpf ? '✅ CPF encontrado — pré-preenchido do cadastro.' : 'O CPF será salvo opcionalmente após gerar o boleto.'}
            </p>
          </div>
        )}
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9aa', marginBottom: 12 }}>{label}{children}</label>
}

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A2E', borderRadius: 20, padding: 28 }
const inp: React.CSSProperties = { background: '#0a0f08', border: '1px solid #2A2A4A', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, width: '100%', boxSizing: 'border-box' }