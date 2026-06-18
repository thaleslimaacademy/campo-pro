'use client'

import { useEffect, useState } from 'react'
import { FileText, ExternalLink, Copy, CheckCircle, Loader2 } from 'lucide-react'
import { listarAtletasBoleto, gerarBoleto, getCpfResponsavel, salvarCpfResponsavel, getTelefoneResponsavel, listarBoletos, cancelarBoleto } from './actions'
import { gerarRecibo } from '@/lib/gerarRecibo'

type Estado = 'form' | 'loading' | 'resultado'

export default function BoletoPage() {
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([])
  const [estado, setEstado] = useState<Estado>('form')
  const [atletaId, setAtletaId] = useState('')
  const [telefoneResp, setTelefoneResp] = useState('')
  const [boletos, setBoletos] = useState<any[]>([])
  const [aba, setAba] = useState<'novo' | 'historico'>('novo')
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
  useEffect(() => { listarBoletos().then(setBoletos).catch(() => {}) }, [])

  useEffect(() => {
    if (!atletaId) return
    setCpf('')
    getCpfResponsavel(atletaId).then(c => { if (c) setCpf(c) }).catch(() => {})
    getTelefoneResponsavel(atletaId).then(t => { if (t) setTelefoneResp(t.replace(/\D/g, '')) }).catch(() => {})
  }, [atletaId])

  const atletaNome = atletas.find(a => a.id === atletaId)?.nome ?? ''

  const gerar = async () => {
    if (!atletaId || !cpf || !valor || !vencimento) { setErro('Preencha todos os campos obrigatórios'); return }
    setErro(''); setEstado('loading')
    try {
      const r = await gerarBoleto({ atletaId, cpf, valor: Number(valor), vencimento, descricao })
      setResultado(r)
      setEstado('resultado')
      listarBoletos().then(setBoletos)
      const salvar = confirm('Salvar CPF para próximas cobranças deste atleta?')
      if (salvar) await salvarCpfResponsavel(atletaId, cpf)
    } catch (e) { setErro((e as Error).message); setEstado('form') }
  }

  const copiar = async () => {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado.bankSlipUrl)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  const calcularJuros = (v: number, venc: string, pagoEm: string | null) => {
    if (!pagoEm) return 0
    const dias = Math.max(0, Math.floor((new Date(pagoEm).getTime() - new Date(venc).getTime()) / 86400000))
    if (dias === 0) return 0
    return v * (0.02 + (dias / 30) * 0.01)
  }

  const statusBoleto = (b: any) => {
    if (b.status === 'CANCELADO') return { label: 'Cancelado', cor: '#666' }
    if (b.status === 'PAGO') {
      return calcularJuros(b.valor, b.vencimento, b.pagoEm) > 0
        ? { label: 'Pago com atraso', cor: '#FF6B00' }
        : { label: 'Pago', cor: '#00C896' }
    }
    return new Date(b.vencimento) < new Date()
      ? { label: 'Vencido', cor: '#FF4444' }
      : { label: 'A vencer', cor: '#FFD700' }
  }

  const handleCancelar = async (id: string, asaasId: string) => {
    if (!confirm('Cancelar este boleto?')) return
    await cancelarBoleto(id, asaasId)
    listarBoletos().then(setBoletos)
  }

  const fmtDate = (d: string) => d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR') : '-'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F0F1A, #0F0F1A, #111003)', color: '#fff', padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B00', margin: '0 0 16px' }}>Boleto</h1>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['novo', 'historico'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, background: aba === a ? '#FF6B00' : 'rgba(255,255,255,0.06)', color: aba === a ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {a === 'novo' ? '➕ Novo Boleto' : '📋 Enviados (' + boletos.length + ')'}
            </button>
          ))}
        </div>

        {/* ABA: HISTORICO */}
        {aba === 'historico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {boletos.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40 }}>Nenhum boleto enviado ainda.</p>
            )}
            {boletos.map(b => {
              const st = statusBoleto(b)
              const juros = calcularJuros(b.valor, b.vencimento, b.pagoEm)
              return (
                <div key={b.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', margin: 0 }}>{b.atletaNome || '-'}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{b.descricao || 'Mensalidade'}</p>
                    </div>
                    <span style={{ background: st.cor + '22', color: st.cor, border: '1px solid ' + st.cor + '55', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Valor</p>
                      <p style={{ color: '#FFD700', fontWeight: 700, fontSize: 14, margin: 0 }}>{'R$ ' + Number(b.valor).toFixed(2)}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Vencimento</p>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, margin: 0 }}>{fmtDate(b.vencimento)}</p>
                    </div>
                    {b.pagoEm && (
                      <div style={{ background: 'rgba(0,200,150,0.08)', borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Pago em</p>
                        <p style={{ color: '#00C896', fontWeight: 600, fontSize: 13, margin: 0 }}>{fmtDate(b.pagoEm)}</p>
                      </div>
                    )}
                    {juros > 0 && (
                      <div style={{ background: 'rgba(255,107,0,0.08)', borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Juros/Multa</p>
                        <p style={{ color: '#FF6B00', fontWeight: 700, fontSize: 13, margin: 0 }}>{'+ R$ ' + juros.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.bankSlipUrl && (
                      <a href={b.bankSlipUrl} target="_blank" rel="noreferrer"
                        style={{ flex: 1, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', color: '#FF6B00', borderRadius: 8, padding: '8px', textAlign: 'center' as const, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        {'📄 Ver boleto'}
                      </a>
                    )}
                    {b.status === 'PENDENTE' && (
                      <button onClick={() => handleCancelar(b.id, b.asaasId)}
                        style={{ flex: 1, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: '#FF4444', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {'🚫 Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ABA: NOVO BOLETO */}
        {aba === 'novo' && (
          <>
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
                  <button onClick={() => {
                    const msg = 'Boleto TLFA - ' + atletaNome + ' - Venc: ' + vencimento.split('-').reverse().join('/') + ' - ' + resultado.bankSlipUrl
                    const num = telefoneResp ? '55' + telefoneResp.replace(/\D/g, '') : ''
                    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank')
                  }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600, cursor: 'pointer', border: 'none', width: '100%' }}>
                    {'💬 Enviar via WhatsApp'}
                  </button>
                  <button onClick={() => gerarRecibo({ tipo: 'MENSALIDADE', nome: atletaNome, valor: Number(valor), descricao, data: new Date().toISOString().slice(0, 10) })}
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
                  <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" style={inp} />
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
          </>
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
