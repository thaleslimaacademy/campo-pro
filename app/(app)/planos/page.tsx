'use client'
import { useState, useTransition } from 'react'
import { usePerfil } from '@/lib/usePerfil'
import { usePlano } from '@/lib/usePlano'
import BottomNav from '@/components/ui/BottomNav'

const T = { bg:'#0A0E1A', surface:'#0D1220', primary:'#4169E1', accent:'#00BFFF', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', gold:'#FFD700' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const PLANOS = [
  { id:'BASICO', label:'Básico', preco:79, precoAnual:65, cor:'#7DD3FC', limite:'Até 50 atletas', features:['50 atletas','1 admin','3 turmas','Presença','Mensalidades'], nao:['WhatsApp auto','App dos pais','Multi-modalidade'] },
  { id:'PRO', label:'Pro', preco:129, precoAnual:107, cor:T.primary, popular:true, limite:'Até 150 atletas', features:['150 atletas','3 usuários','Turmas ilimitadas','WhatsApp auto','Dashboard financeiro','3 modalidades','Campeonatos'], nao:['App dos pais'] },
  { id:'ELITE', label:'Elite', preco:199, precoAnual:165, cor:T.gold, limite:'Ilimitado', features:['Atletas ilimitados','Usuários ilimitados','Todas modalidades','WhatsApp auto','App dos pais','IA de treinamentos','Múltiplas unidades'], nao:[] },
]
const NIVEL: Record<string,number> = { BASICO:1, PRO:2, ELITE:3 }

export default function PlanosApp() {
  const { escolaId } = usePerfil()
  const { planoEfetivo, trialAtivo, diasRestantes } = usePlano()
  const [anual, setAnual] = useState(false)
  const [processando, setProcessando] = useState<string|null>(null)
  const [erro, setErro] = useState('')

  async function assinar(planoId: string) {
    if (!escolaId) return
    setProcessando(planoId); setErro('')
    try {
      const res = await fetch('/api/asaas/criar-assinatura', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ escolaId, plano:planoId, nome:'', email:'', whatsapp:'' }) })
      const data = await res.json()
      if (data.ok && data.paymentLink) { window.location.href = data.paymentLink }
      else setErro(data.error || 'Erro ao gerar link de pagamento.')
    } catch { setErro('Erro de conexão. Tente novamente.') }
    setProcessando(null)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:INTER, paddingBottom:80 }}>
      <div style={{ background:T.primary, padding:'20px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <a href="/dashboard" style={{ color:'rgba(240,244,255,0.7)', textDecoration:'none', fontSize:16 }}>←</a>
          <div>
            <div style={{ fontSize:10, color:'rgba(240,244,255,0.65)', textTransform:'uppercase', letterSpacing:2, fontWeight:700, marginBottom:2 }}>GestãoFC</div>
            <div style={{ fontFamily:SYNE, fontWeight:900, fontSize:22, color:T.text, letterSpacing:-0.5, textTransform:'uppercase' }}>Planos</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'20px 16px 0' }}>
        {trialAtivo && (
          <div style={{ background:`${T.green}10`, border:`1px solid ${T.green}25`, borderRadius:12, padding:'12px 14px', marginBottom:16, textAlign:'center' }}>
            <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:T.green, margin:'0 0 3px' }}>🎉 Período de teste Elite ativo</p>
            <p style={{ fontSize:12, color:T.muted, margin:0 }}>{diasRestantes} dias restantes — assine para continuar após o trial</p>
          </div>
        )}

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontSize:11, color:T.muted, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:0.8 }}>Plano atual</p>
            <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:T.text, margin:0 }}>{trialAtivo?'Elite (trial)':planoEfetivo}</p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:20 }}>
          <span style={{ fontSize:13, color:anual?T.muted:T.text }}>Mensal</span>
          <button onClick={() => setAnual(!anual)} style={{ width:48, height:26, borderRadius:13, background:anual?T.primary:'rgba(240,244,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
            <span style={{ position:'absolute', top:3, left:anual?24:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', display:'block' }} />
          </button>
          <span style={{ fontSize:13, color:anual?T.text:T.muted }}>Anual <span style={{ background:`${T.green}15`, color:T.green, fontSize:10, padding:'2px 7px', borderRadius:8, fontWeight:700 }}>-18%</span></span>
        </div>

        {erro && <div style={{ background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.25)', borderRadius:10, padding:'11px 14px', marginBottom:16 }}><p style={{ color:'#FF4444', fontSize:13, margin:0 }}>❌ {erro}</p></div>}

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {PLANOS.map(p => {
            const atual    = !trialAtivo && planoEfetivo === p.id
            const inferior = NIVEL[p.id] < NIVEL[planoEfetivo] && !trialAtivo
            const preco    = anual ? p.precoAnual : p.preco
            const loading  = processando === p.id
            return (
              <div key={p.id} style={{ background:T.surface, border:`2px solid ${p.popular?T.primary:p.id==='ELITE'?`${T.gold}44`:T.border}`, borderRadius:14, padding:20, position:'relative', boxShadow:p.popular?`0 0 24px ${T.primary}18`:undefined }}>
                {p.popular && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:T.primary, color:'#fff', fontSize:10, fontWeight:800, padding:'3px 14px', borderRadius:20, fontFamily:SYNE, whiteSpace:'nowrap' }}>MAIS POPULAR</div>}
                {p.id==='ELITE' && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:T.gold, color:'#0A0E1A', fontSize:10, fontWeight:800, padding:'3px 14px', borderRadius:20, fontFamily:SYNE, whiteSpace:'nowrap' }}>COMPLETO</div>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:20, color:p.cor, margin:'0 0 3px' }}>{p.label}</p>
                    <p style={{ fontSize:11, color:T.muted, margin:0 }}>{p.limite}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:28, color:T.text, margin:0, lineHeight:1 }}>R${preco}</p>
                    <p style={{ fontSize:10, color:T.muted, margin:'2px 0 0' }}>/mês{anual?' (anual)':''}</p>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {p.features.map(f => <div key={f} style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ color:T.green, fontSize:12 }}>✓</span><span style={{ fontSize:12, color:'rgba(240,244,255,0.8)' }}>{f}</span></div>)}
                  {p.nao.map(f => <div key={f} style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ color:T.muted, fontSize:12 }}>✗</span><span style={{ fontSize:12, color:T.muted }}>{f}</span></div>)}
                </div>
                {atual ? (
                  <div style={{ textAlign:'center', padding:12, background:`${T.green}10`, borderRadius:8, border:`1px solid ${T.green}25` }}>
                    <p style={{ color:T.green, fontFamily:SYNE, fontWeight:700, fontSize:12, margin:0 }}>✅ Plano atual</p>
                  </div>
                ) : inferior ? (
                  <div style={{ textAlign:'center', padding:12, background:T.border, borderRadius:8 }}>
                    <p style={{ color:T.muted, fontSize:12, margin:0 }}>Plano inferior ao atual</p>
                  </div>
                ) : (
                  <button onClick={() => assinar(p.id)} disabled={!!processando} style={{ width:'100%', background:loading?T.border:p.id==='ELITE'?T.gold:T.primary, color:p.id==='ELITE'&&!loading?'#0A0E1A':T.text, padding:14, borderRadius:10, fontFamily:SYNE, fontWeight:800, fontSize:13, border:'none', cursor:processando?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:loading?0.7:1 }}>
                    {loading ? 'Gerando link...' : trialAtivo ? `Assinar ${p.label}` : `Upgrade para ${p.label}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p style={{ textAlign:'center', fontSize:11, color:T.muted, margin:'20px 0 0', lineHeight:1.6 }}>Sem fidelidade no mensal · Cancele quando quiser<br />Pagamento via PIX ou cartão · Processado pelo Asaas</p>
      </div>
      <BottomNav />
    </div>
  )
}
