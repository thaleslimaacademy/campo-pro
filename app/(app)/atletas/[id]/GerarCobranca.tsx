'use client'
import { useState } from 'react'

const T = { bg:'#0A0E1A', surface:'#0D1220', surface2:'#121A2E', primary:'#4169E1', accent:'#00BFFF', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444' }
const SYNE = 'Syne, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.1)`, borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:'Inter,sans-serif', fontSize:13, boxSizing:'border-box' }
const LBL: React.CSSProperties = { fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:4 }

export default function GerarCobranca({ atletaId, atletaNome }: { atletaId: string; atletaNome: string }) {
  const [aberto, setAberto]       = useState(false)
  const [valor, setValor]         = useState('150')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('Mensalidade')
  const [gerando, setGerando]     = useState(false)
  const [pix, setPix]             = useState<{ copiaCola: string; qrCode: string } | null>(null)
  const [copiado, setCopiado]     = useState(false)

  async function gerar() {
    if (!vencimento) return
    setGerando(true)
    const res  = await fetch('/api/cobranca', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ atletaId, valor: parseFloat(valor), vencimento, descricao }) })
    const data = await res.json()
    if (data.sucesso) setPix({ copiaCola: data.pixCopiaCola, qrCode: data.pixQrCode })
    else alert('Erro: ' + JSON.stringify(data.error))
    setGerando(false)
  }

  function copiar() {
    if (!pix?.copiaCola) return
    navigator.clipboard.writeText(pix.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  /* ── PIX GERADO ── */
  if (pix) return (
    <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}25`, borderRadius:14, padding:16, marginBottom:12 }}>
      <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:T.green, marginBottom:12, textAlign:'center' }}>✅ Cobrança gerada!</p>
      {pix.qrCode && (
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <img src={`data:image/png;base64,${pix.qrCode}`} alt="QR Code PIX" style={{ width:176, height:176, borderRadius:10, border:`1px solid ${T.border}`, background:'#fff', padding:6 }} />
        </div>
      )}
      <button onClick={copiar} style={{ width:'100%', background:copiado?`${T.green}20`:T.primary, border:`1px solid ${copiado?T.green+'44':T.primary}`, color:T.text, padding:'13px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, transition:'all 0.2s' }}>
        {copiado ? '✅ Copiado!' : '📋 Copiar PIX Copia e Cola'}
      </button>
      <button onClick={() => { setPix(null); setAberto(false) }} style={{ width:'100%', background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'10px', borderRadius:8, fontFamily:SYNE, fontWeight:600, fontSize:12, cursor:'pointer' }}>
        Fechar
      </button>
    </div>
  )

  /* ── BOTÃO FECHADO ── */
  if (!aberto) return (
    <button onClick={() => setAberto(true)} style={{ width:'100%', background:`${T.primary}18`, border:`1px solid ${T.primary}44`, color:T.primary, padding:'14px', borderRadius:12, fontFamily:SYNE, fontWeight:800, fontSize:13, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ fontSize:16 }}>💰</span> Gerar Cobrança PIX
    </button>
  )

  /* ── FORM ABERTO ── */
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.primary}`, borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:T.primary, textTransform:'uppercase', letterSpacing:0.5 }}>💰 Nova Cobrança</p>
        <button onClick={() => setAberto(false)} style={{ background:'transparent', border:'none', color:T.muted, fontSize:18, cursor:'pointer', lineHeight:1 }}>✕</button>
      </div>
      <p style={{ fontSize:11, color:T.muted, marginBottom:14 }}>{atletaNome}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div><label style={LBL}>Valor (R$)</label><input value={valor} onChange={e => setValor(e.target.value)} type="number" style={INP} /></div>
        <div><label style={LBL}>Vencimento</label><input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" style={INP} /></div>
        <div><label style={LBL}>Descrição</label><input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" style={INP} /></div>
        <button onClick={gerar} disabled={gerando || !vencimento} style={{ background:T.primary, color:T.text, padding:'13px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:13, border:'none', cursor:gerando||!vencimento?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:gerando||!vencimento?0.5:1, transition:'opacity 0.15s' }}>
          {gerando ? 'Gerando...' : 'Gerar PIX'}
        </button>
      </div>
    </div>
  )
}
