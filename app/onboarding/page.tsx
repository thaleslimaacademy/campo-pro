'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'

const T = { bg:'#0A0E1A', surface:'#0D1220', primary:'#4169E1', accent:'#00BFFF', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.12)`, borderRadius:10, padding:'13px 14px', color:T.text, fontFamily:INTER, fontSize:14, boxSizing:'border-box', outline:'none', marginTop:6 }
const LBL: React.CSSProperties = { fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'0.8px' }
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ nomeEscola:'', slug:'', cidade:'', estado:'MG', telefone:'', whatsapp:'', responsavel:'' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(p => {
      const updated = { ...p, [name]: value }
      // auto-gera slug a partir do nome se slug ainda não foi editado manualmente
      if (name === 'nomeEscola') {
        const auto = value.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '').trim()
          .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30)
        updated.slug = auto
      }
      return updated
    })
    setErro('')
  }

  async function finalizar() {
    if (!form.responsavel || !form.whatsapp) { setErro('Preencha todos os campos obrigatórios.'); return }
    setSalvando(true)
    setErro('')
    const res = await fetch('/api/escola/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomeEscola: form.nomeEscola, slug: form.slug || undefined, cidade: form.cidade, estado: form.estado, telefone: form.telefone, whatsapp: form.whatsapp, responsavel: form.responsavel, plano: 'BASICO' }),
    })
    const data = await res.json()
    if (!data.ok) { setErro('Erro: ' + data.message); setSalvando(false); return }
    window.location.href = '/dashboard'
  }

  const progress = (step / 2) * 100

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:INTER }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src="/icon-512.png" alt="GestaoFC" style={{ width:72, height:72, borderRadius:18, objectFit:'cover', display:'block', margin:'0 auto 14px' }} />
          <h1 style={{ fontFamily:SYNE, fontWeight:900, fontSize:26, color:T.text, margin:'0 0 4px', letterSpacing:-0.5 }}>GestãoFC</h1>
          <p style={{ color:T.muted, fontSize:13, margin:0 }}>Configure sua escolinha em 2 minutos</p>
        </div>

        {/* Trial badge */}
        <div style={{ background:`${T.green}10`, border:`1px solid ${T.green}30`, borderRadius:10, padding:'10px 16px', marginBottom:24, textAlign:'center' }}>
          <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:12, color:T.green, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:0.5 }}>🎉 15 dias GRÁTIS</p>
          <p style={{ fontSize:11, color:T.muted, margin:0 }}>Acesso completo ao plano Elite — sem cartão</p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:11, color:T.primary, fontFamily:SYNE, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8 }}>Etapa {step} de 2</span>
            <span style={{ fontSize:11, color:T.muted }}>{step === 1 ? 'Dados da escola' : 'Dados do responsável'}</span>
          </div>
          <div style={{ height:3, background:T.border, borderRadius:4 }}>
            <div style={{ height:'100%', background:T.primary, borderRadius:4, width:`${progress}%`, transition:'width 0.3s ease' }} />
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{ background:`${T.red}10`, border:`1px solid ${T.red}30`, borderRadius:10, padding:'11px 14px', marginBottom:16 }}>
            <p style={{ color:T.red, fontSize:13, margin:0 }}>❌ {erro}</p>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.primary}`, borderRadius:14, padding:20, marginBottom:16 }}>
            <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:12, color:T.primary, textTransform:'uppercase', letterSpacing:1, marginBottom:18 }}>🏟️ Dados da Escola</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={LBL}>Nome da escolinha *</label><input name="nomeEscola" value={form.nomeEscola} onChange={handleChange} placeholder="Ex: TLFA Iturama" style={INP} /></div>
              <div>
                <label style={LBL}>Link da matrícula (slug)</label>
                <div style={{ display:'flex', alignItems:'center', marginTop:6 }}>
                  <span style={{ fontSize:11, color:T.muted, whiteSpace:'nowrap', paddingRight:6 }}>gestaofc.com.br/matricula/</span>
                  <input name="slug" value={form.slug} onChange={handleChange} placeholder="tlfa-iturama" style={{ ...INP, marginTop:0, flex:1 }} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:10 }}>
                <div><label style={LBL}>Cidade</label><input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" style={INP} /></div>
                <div><label style={LBL}>Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} style={{ ...INP }}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.accent}`, borderRadius:14, padding:20, marginBottom:16 }}>
            <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:12, color:T.accent, textTransform:'uppercase', letterSpacing:1, marginBottom:18 }}>👤 Dados do Responsável</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={LBL}>Seu nome completo *</label><input name="responsavel" value={form.responsavel} onChange={handleChange} placeholder="Nome completo" style={INP} /></div>
              <div><label style={LBL}>WhatsApp *</label><input name="whatsapp" value={form.whatsapp} onChange={handleChange} type="tel" placeholder="(34) 99999-9999" style={INP} /></div>
              <div><label style={LBL}>Telefone</label><input name="telefone" value={form.telefone} onChange={handleChange} type="tel" placeholder="(34) 9999-9999" style={INP} /></div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div style={{ display:'flex', gap:10 }}>
          {step === 2 && (
            <button onClick={() => setStep(1)} style={{ flex:1, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'14px', borderRadius:12, fontFamily:SYNE, fontWeight:700, fontSize:13, cursor:'pointer' }}>
              ← Voltar
            </button>
          )}
          {step === 1 && (
            <button onClick={() => { if (!form.nomeEscola) { setErro('Nome da escola obrigatório.'); return }; setErro(''); setStep(2) }}
              style={{ flex:1, background:T.primary, color:T.text, padding:'15px', borderRadius:12, fontFamily:SYNE, fontWeight:800, fontSize:14, border:'none', cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5 }}>
              Continuar →
            </button>
          )}
          {step === 2 && (
            <button onClick={finalizar} disabled={salvando}
              style={{ flex:2, background:salvando?T.border:T.primary, color:T.text, padding:'15px', borderRadius:12, fontFamily:SYNE, fontWeight:800, fontSize:14, border:'none', cursor:salvando?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:salvando?0.7:1 }}>
              {salvando ? 'Criando...' : '🚀 Começar grátis'}
            </button>
          )}
        </div>

        {/* Resumo do trial */}
        <div style={{ marginTop:24, padding:'14px 16px', background:`${T.primary}08`, border:`1px solid ${T.border}`, borderRadius:10 }}>
          <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:11, color:T.primary, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:0.8 }}>O que você recebe grátis:</p>
          {['✅ 15 dias plano Elite completo','✅ Atletas, turmas e presença ilimitados','✅ WhatsApp automático','✅ App dos pais','✅ IA de treinamentos','✅ Sem cartão de crédito'].map(item => (
            <p key={item} style={{ fontSize:12, color:T.muted, margin:'4px 0 0' }}>{item}</p>
          ))}
        </div>

        <p style={{ textAlign:'center', fontSize:11, color:`${T.muted}80`, marginTop:20 }}>GestãoFC · Gestão inteligente de escolinhas</p>
      </div>
    </div>
  )
}
