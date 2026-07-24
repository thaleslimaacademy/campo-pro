'use client'
import { useState, useEffect } from 'react'


const T = { surface:'#0D1220', primary:'#4169E1', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444', amber:'#FFB84D' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.1)`, borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:INTER, fontSize:13, boxSizing:'border-box' }
const LBL: React.CSSProperties = { fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:4 }

const DIAS = ['1','5','10','15','20','25','28']
const FORMAS = ['PIX','Dinheiro','Cartão','Transferência']

export default function GerarCobranca({ atletaId, atletaNome, escolaId }: { atletaId: string; atletaNome: string; escolaId: string }) {
  const [temAsaas, setTemAsaas]   = useState<boolean | null>(null)
  const [aberto, setAberto]       = useState(false)
  const [valor, setValor]         = useState('150')
  const [vencimento, setVencimento] = useState('')
  const [diaVenc, setDiaVenc]     = useState('10')
  const [periodo, setPeriodo]     = useState('mensal')
  const [forma, setForma]         = useState('PIX')
  const [descricao, setDescricao] = useState('Mensalidade')
  const [gerando, setGerando]     = useState(false)
  const [pix, setPix]             = useState<{ copiaCola: string; qrCode: string } | null>(null)
  const [copiado, setCopiado]     = useState(false)
  const [conflito, setConflito]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/escola-config')
      .then(r => r.json())
      .then(d => setTemAsaas(d.temAsaas))
      .catch(() => setTemAsaas(false))
  }, [escolaId])

  async function gerarManual() {
    setGerando(true)
    const qtd = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 1
    const res = await fetch('/api/cobranca-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId, escolaId, valor: Number(valor), diaVencimento: Number(diaVenc), periodo }),
    })
    const data = await res.json()
    setGerando(false)
    setAberto(false)
    if (data.ok) {
      const n = data.geradas ?? qtd
      const pul = data.puladas?.length ? ` (${data.puladas.length} mês(es) já tinha(m) mensalidade e foram pulados)` : ''
      alert(`✅ ${n} cobrança(s) gerada(s) para ${atletaNome}!${pul}`)
    } else alert(data.error || 'Erro: tente novamente')
  }

  async function gerarAsaas(forcar = false) {
    setGerando(true)
    setConflito(null)
    const res  = await fetch('/api/cobranca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ atletaId, valor: parseFloat(valor), vencimento, descricao, forcar }) })
    const data = await res.json()
    setGerando(false)
    if (data.sucesso) { setPix({ copiaCola: data.pixCopiaCola, qrCode: data.pixQrCode }); return }
    if (res.status === 409 && data.jaExiste) { setConflito(data.error); return }
    alert('Erro: ' + (data.error || JSON.stringify(data)))
  }

  function copiar() {
    if (!pix?.copiaCola) return
    navigator.clipboard.writeText(pix.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // PIX gerado
  if (pix) return (
    <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}25`, borderRadius:14, padding:16, marginBottom:12 }}>
      <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:T.green, marginBottom:12, textAlign:'center' }}>✅ PIX gerado!</p>
      {pix.qrCode && <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><img src={`data:image/png;base64,${pix.qrCode}`} alt="QR PIX" style={{ width:176, height:176, borderRadius:10, background:'#fff', padding:6 }} /></div>}
      <button onClick={copiar} style={{ width:'100%', background:copiado?`${T.green}20`:T.primary, border:`1px solid ${copiado?T.green+'44':T.primary}`, color:T.text, padding:'13px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', textTransform:'uppercase', marginBottom:8 }}>
        {copiado ? '✅ Copiado!' : '📋 Copiar PIX Copia e Cola'}
      </button>
      <button onClick={() => { setPix(null); setAberto(false) }} style={{ width:'100%', background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'10px', borderRadius:8, fontFamily:SYNE, fontWeight:600, fontSize:12, cursor:'pointer' }}>Fechar</button>
    </div>
  )

  // Botão fechado
  if (!aberto) return (
    <button onClick={() => setAberto(true)} style={{ width:'100%', background:`${T.primary}18`, border:`1px solid ${T.primary}44`, color:T.primary, padding:'14px', borderRadius:12, fontFamily:SYNE, fontWeight:800, fontSize:13, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ fontSize:16 }}>💰</span> Gerar Cobrança
    </button>
  )

  // Form
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.primary}`, borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:T.primary, textTransform:'uppercase', letterSpacing:0.5 }}>💰 Nova Cobrança</p>
        <button onClick={() => { setAberto(false); setConflito(null) }} style={{ background:'transparent', border:'none', color:T.muted, fontSize:18, cursor:'pointer' }}>✕</button>
      </div>
      <p style={{ fontSize:11, color:T.muted, marginBottom:14 }}>{atletaNome} · {temAsaas ? 'PIX via Asaas' : 'Cobrança manual'}</p>

      {conflito && (
        <div style={{ background:`${T.amber}12`, border:`1px solid ${T.amber}44`, borderRadius:10, padding:12, marginBottom:14 }}>
          <p style={{ fontSize:12, color:T.amber, marginBottom:10, lineHeight:1.4 }}>{conflito}</p>
          <button
            onClick={() => gerarAsaas(true)}
            disabled={gerando}
            style={{ width:'100%', background:T.amber, color:'#1a1200', padding:'11px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:12, border:'none', cursor:gerando?'not-allowed':'pointer', textTransform:'uppercase', opacity:gerando?0.5:1 }}>
            {gerando ? 'Substituindo...' : 'Cancelar a anterior e substituir'}
          </button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div><label style={LBL}>Valor (R$)</label><input value={valor} onChange={e => setValor(e.target.value)} type="number" style={INP} /></div>

        {temAsaas ? (
          <div><label style={LBL}>Vencimento</label><input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" style={INP} /></div>
        ) : (
          <>
            <div><label style={LBL}>Dia de vencimento</label>
              <select value={diaVenc} onChange={e => setDiaVenc(e.target.value)} style={INP}>
                {DIAS.map(d => <option key={d} value={d}>Dia {d}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Período</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['mensal','Mensal'],['semestral','6 meses'],['anual','Anual']].map(([v,l]) => (
                  <button key={v} onClick={() => setPeriodo(v)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${periodo===v?T.primary:T.border}`, background:periodo===v?`${T.primary}18`:'transparent', color:periodo===v?T.primary:T.muted, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer' }}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={LBL}>Forma de pagamento</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {FORMAS.map(f => (
                  <button key={f} onClick={() => setForma(f)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${forma===f?T.green:T.border}`, background:forma===f?`${T.green}15`:'transparent', color:forma===f?T.green:T.muted, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer', minWidth:70 }}>{f}</button>
                ))}
              </div>
            </div>
          </>
        )}

        <div><label style={LBL}>Descrição</label><input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" style={INP} /></div>

        <button
          onClick={() => { setConflito(null); temAsaas ? gerarAsaas(false) : gerarManual() }}
          disabled={gerando || (temAsaas ? !vencimento : false)}
          style={{ background:T.primary, color:T.text, padding:'13px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:13, border:'none', cursor:gerando?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:gerando?0.5:1 }}>
          {gerando ? 'Gerando...' : temAsaas ? 'Gerar PIX' : `Gerar cobrança${periodo!=='mensal'?` (${periodo==='semestral'?6:12}x)`:''}`}
        </button>
      </div>
    </div>
  )
}
