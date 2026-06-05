'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { criarEscola } from './actions'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nomeEscola: '',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    responsavel: '',
  })

  // ── Tokens visuais ──
  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const bg = 'linear-gradient(160deg,#0a1a06,#050505,#111003)'
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '6px', outline: 'none', boxSizing: 'border-box' as const }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErro('')
  }

  async function finalizar() {
    if (!form.nomeEscola || !form.responsavel || !form.whatsapp) {
      setErro('Preencha os campos obrigatórios.')
      return
    }
    if (!user) return
    setSalvando(true)
    setErro('')

    const result = await criarEscola(
      user.id,
      user.emailAddresses[0]?.emailAddress || '',
      form.nomeEscola,
      form.cidade,
      form.estado,
      form.telefone,
      form.whatsapp,
      form.responsavel
    )

    if (!result.ok) {
      setErro('Erro: ' + result.message)
      setSalvando(false)
      return
    }

    window.location.href = '/dashboard'
  }

  const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

  const stepLabel = step === 1 ? 'Dados da Escola' : 'Dados do Responsável'

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 14px', boxShadow: '0 0 20px rgba(57,255,20,0.15)' }}>
            ⚽
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: '28px', color: neon, margin: '0 0 4px', letterSpacing: '-0.5px' }}>GestaoFC</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Configure sua escolinha</p>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: gold, fontFamily: syne, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Etapa {step} de 2
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{stepLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2].map(s => (
              <div
                key={s}
                style={{ flex: 1, height: '3px', borderRadius: '4px', background: step >= s ? neon : 'rgba(255,255,255,0.1)', boxShadow: step >= s ? '0 0 8px rgba(57,255,20,0.4)' : 'none', transition: 'all 0.3s' }}
              />
            ))}
          </div>
        </div>

        {/* ── ERRO ── */}
        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>❌ {erro}</p>
          </div>
        )}

        {/* ── STEP 1: DADOS DA ESCOLA ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                🏟️ Dados da Escola
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome da escola *</label>
                <input name="nomeEscola" value={form.nomeEscola} onChange={handleChange} placeholder="Ex: Academia FC" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cidade</label>
                  <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' as const }}>
                    {estados.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => { if (!form.nomeEscola) { setErro('Nome obrigatório.'); return }; setErro(''); setStep(2) }}
              style={{ width: '100%', background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', padding: '15px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(57,255,20,0.25)' }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── STEP 2: DADOS DO RESPONSÁVEL ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                👤 Dados do Responsável
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Seu nome completo *</label>
                <input name="responsavel" value={form.responsavel} onChange={handleChange} placeholder="Nome completo" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>WhatsApp *</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} type="tel" placeholder="(34) 99999-9999" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Telefone</label>
                <input name="telefone" value={form.telefone} onChange={handleChange} type="tel" placeholder="(34) 9999-9999" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, fontFamily: syne, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
              >
                ← Voltar
              </button>
              <button
                onClick={finalizar}
                disabled={salvando}
                style={{ flex: 2, background: salvando ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: salvando ? 'rgba(255,255,255,0.3)' : '#050505', padding: '15px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', boxShadow: salvando ? 'none' : '0 0 20px rgba(57,255,20,0.25)' }}
              >
                {salvando ? 'Criando...' : '🚀 Começar'}
              </button>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '24px' }}>
          GestaoFC · Gestão inteligente de escolinhas
        </p>

      </div>
    </div>
  )
}
