'use client'
import { useEffect, useState } from 'react'

const T = { bg:'#0A0E1A', surface:'#0D1220', surface2:'#121A2E', primary:'#4169E1', accent:'#00BFFF', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', gold:'#FFD700', red:'#FF4444' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const CARD: React.CSSProperties = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16, marginBottom:12 }

type EscolaStats = {
  id: string; nome: string; slug: string; cidade: string; estado: string
  planoGestaoFC: string; statusPlano: string; trialAtivo: boolean; diasTrial: number
  trialEndsAt: string | null; ativo: boolean; adminEmail: string | null
  totalAtletas: number; receitaMes: number; totalCobrancas: number; createdAt: string
}

const COR_PLANO: Record<string, string> = { ELITE: T.gold, PRO: T.primary, BASICO: T.accent, STARTER: T.accent, SOCIAL: T.muted }

export default function SuperAdmin() {
  const [escolas, setEscolas] = useState<EscolaStats[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [acao, setAcao] = useState<{ escolaId: string; tipo: 'plano' | 'trial' } | null>(null)
  const [novoPlano, setNovoPlano] = useState('ELITE')
  const [diasTrial, setDiasTrial] = useState('15')
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setLoading(true)
    const res = await fetch('/api/super-admin/escolas')
    if (!res.ok) { setErro('Acesso negado. Você precisa ser super-admin.'); setLoading(false); return }
    const data = await res.json()
    setEscolas(data)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function aplicarAcao() {
    if (!acao) return
    setSalvando(true)
    const body: Record<string, unknown> = { escolaId: acao.escolaId }
    if (acao.tipo === 'plano') body.plano = novoPlano
    if (acao.tipo === 'trial') body.trialDias = Number(diasTrial)
    await fetch('/api/super-admin/escolas', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    setAcao(null)
    setSalvando(false)
    carregar()
  }

  const totalAtletas = escolas.reduce((s, e) => s + e.totalAtletas, 0)
  const totalReceita = escolas.reduce((s, e) => s + e.receitaMes, 0)
  const trialsAtivos = escolas.filter(e => e.trialAtivo).length
  const pagantes     = escolas.filter(e => !e.trialAtivo && e.statusPlano === 'ATIVO').length

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:T.muted, fontFamily:INTER }}>Carregando...</p>
    </div>
  )

  if (erro) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:32, marginBottom:12 }}>🔒</p>
        <p style={{ color:T.red, fontFamily:SYNE, fontWeight:800, fontSize:16 }}>{erro}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:INTER, padding:'0 0 40px' }}>

      {/* HEADER */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'20px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:24, color:T.text, margin:'0 0 4px', letterSpacing:-0.5 }}>⚡ Super Admin</p>
            <p style={{ fontSize:12, color:T.muted, margin:0 }}>GestãoFC · Painel de controle</p>
          </div>
          <button onClick={carregar} style={{ background:`${T.primary}18`, border:`1px solid ${T.primary}44`, color:T.primary, padding:'8px 16px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' }}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 24px' }}>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Escolas', valor:escolas.length, color:T.primary },
            { label:'Atletas', valor:totalAtletas, color:T.accent },
            { label:'Trials ativos', valor:trialsAtivos, color:T.gold },
            { label:'Pagantes', valor:pagantes, color:T.green },
          ].map(k => (
            <div key={k.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderTop:`2px solid ${k.color}`, borderRadius:12, padding:'14px 16px' }}>
              <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:28, color:k.color, margin:'0 0 4px', lineHeight:1 }}>{k.valor}</p>
              <p style={{ fontSize:11, color:T.muted, margin:0, textTransform:'uppercase', letterSpacing:0.8 }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Receita do mês */}
        <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}25`, borderRadius:12, padding:'14px 18px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontSize:11, color:T.muted, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:0.8 }}>Receita total do mês</p>
            <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:28, color:T.green, margin:0 }}>R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits:2 })}</p>
          </div>
          <span style={{ fontSize:32 }}>💰</span>
        </div>

        {/* Modal de ação */}
        {acao && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:24 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:24, width:'100%', maxWidth:380 }}>
              <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:T.text, marginBottom:16 }}>
                {acao.tipo === 'plano' ? '🔼 Alterar plano' : '⏱️ Adicionar trial'}
              </p>
              {acao.tipo === 'plano' ? (
                <div>
                  <p style={{ fontSize:11, color:T.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:0.8 }}>Novo plano</p>
                  <select value={novoPlano} onChange={e => setNovoPlano(e.target.value)} style={{ width:'100%', background:'#080C15', border:`1px solid ${T.border}`, borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:INTER, fontSize:13, marginBottom:16 }}>
                    <option value="ELITE">Elite — R$199/mês</option>
                    <option value="PRO">Pro — R$129/mês</option>
                    <option value="STARTER">Starter — R$79/mês</option>
                  </select>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize:11, color:T.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:0.8 }}>Dias de trial</p>
                  <input type="number" value={diasTrial} onChange={e => setDiasTrial(e.target.value)} style={{ width:'100%', background:'#080C15', border:`1px solid ${T.border}`, borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:INTER, fontSize:13, marginBottom:16, boxSizing:'border-box' }} />
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setAcao(null)} style={{ flex:1, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'12px', borderRadius:8, fontFamily:SYNE, fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancelar</button>
                <button onClick={aplicarAcao} disabled={salvando} style={{ flex:2, background:T.primary, color:T.text, padding:'12px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:13, border:'none', cursor:'pointer', textTransform:'uppercase' }}>
                  {salvando ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de escolas */}
        <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>{escolas.length} escola{escolas.length !== 1 ? 's' : ''} cadastrada{escolas.length !== 1 ? 's' : ''}</p>

        {escolas.map(e => (
          <div key={e.id} style={{ ...CARD, borderLeft:`3px solid ${COR_PLANO[e.planoGestaoFC] || T.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:T.text, margin:0 }}>{e.nome}</p>
                  {!e.ativo && <span style={{ fontSize:9, color:T.red, background:`${T.red}18`, padding:'2px 8px', borderRadius:4, fontWeight:700 }}>INATIVA</span>}
                </div>
                <p style={{ fontSize:12, color:T.muted, margin:'0 0 2px' }}>{e.cidade}/{e.estado} · /{e.slug}</p>
                {e.adminEmail && <p style={{ fontSize:11, color:T.muted, margin:0 }}>📧 {e.adminEmail}</p>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:800, color:COR_PLANO[e.planoGestaoFC] || T.muted, background:`${COR_PLANO[e.planoGestaoFC] || T.muted}18`, padding:'3px 10px', borderRadius:6, textTransform:'uppercase', letterSpacing:0.5 }}>
                  {e.planoGestaoFC}
                </span>
                {e.trialAtivo && (
                  <span style={{ fontSize:10, fontWeight:700, color:T.gold, background:`${T.gold}15`, padding:'2px 8px', borderRadius:4 }}>
                    ⏱️ Trial: {e.diasTrial}d
                  </span>
                )}
                {!e.trialAtivo && e.statusPlano === 'ATIVO' && (
                  <span style={{ fontSize:10, fontWeight:700, color:T.green, background:`${T.green}15`, padding:'2px 8px', borderRadius:4 }}>✅ Pago</span>
                )}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
              {[
                { label:'Atletas', valor:e.totalAtletas, color:T.accent },
                { label:'Cobranças/mês', valor:e.totalCobrancas, color:T.muted },
                { label:'Receita/mês', valor:`R$${e.receitaMes.toFixed(0)}`, color:T.green },
              ].map(s => (
                <div key={s.label} style={{ background:T.surface2, borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                  <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:s.color, margin:'0 0 2px', lineHeight:1 }}>{s.valor}</p>
                  <p style={{ fontSize:10, color:T.muted, margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize:10, color:T.muted, margin:'0 0 10px' }}>
              Criada em {new Date(e.createdAt).toLocaleDateString('pt-BR')}
              {e.trialEndsAt && !e.trialAtivo && ` · Trial encerrou em ${new Date(e.trialEndsAt).toLocaleDateString('pt-BR')}`}
            </p>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setAcao({ escolaId:e.id, tipo:'plano' }); setNovoPlano('ELITE') }}
                style={{ flex:1, background:`${T.primary}15`, border:`1px solid ${T.primary}33`, color:T.primary, padding:'9px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase' }}>
                🔼 Alterar plano
              </button>
              <button onClick={() => { setAcao({ escolaId:e.id, tipo:'trial' }); setDiasTrial('15') }}
                style={{ flex:1, background:`${T.gold}10`, border:`1px solid ${T.gold}30`, color:T.gold, padding:'9px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase' }}>
                ⏱️ +Trial
              </button>
              <a href={`/atletas?escola=${e.id}`}
                style={{ flex:1, background:`${T.green}10`, border:`1px solid ${T.green}25`, color:T.green, padding:'9px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase', textDecoration:'none', textAlign:'center' }}>
                👁️ Ver escola
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
