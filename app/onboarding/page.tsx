'use client'

import { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

const PLANOS = [
  {
    id: 'BASICO',
    nome: 'Básico',
    preco: 79,
    limite: 'Até 50 atletas',
    destaques: ['1 usuário', 'Até 3 turmas', 'Só futebol'],
    cor: 'rgba(255,255,255,0.1)',
    corBorder: 'rgba(255,255,255,0.15)',
    popular: false,
  },
  {
    id: 'PRO',
    nome: 'Pro',
    preco: 129,
    limite: 'Até 150 atletas',
    destaques: ['3 usuários', 'WhatsApp auto', 'Relatórios PDF'],
    cor: 'rgba(255,107,0,0.12)',
    corBorder: '#FF6B00',
    popular: true,
  },
  {
    id: 'ELITE',
    nome: 'Elite',
    preco: 199,
    limite: 'Atletas ilimitados',
    destaques: ['Usuários ilimitados', 'App dos pais', 'IA + automações'],
    cor: 'rgba(255,215,0,0.08)',
    corBorder: '#FFD700',
    popular: false,
  },
]

export default function Onboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [planoSelecionado, setPlanoSelecionado] = useState('PRO')
  const [form, setForm] = useState({
    nomeEscola: '',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    responsavel: '',
  })

  useEffect(() => {
    const planoParam = searchParams.get('plano')?.toUpperCase()
    if (planoParam && ['BASICO', 'PRO', 'ELITE'].includes(planoParam)) {
      setPlanoSelecionado(planoParam)
    }
  }, [searchParams])

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
    setSalvando(true)
    setErro('')

    const escolaRes = await fetch('/api/escola/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeEscola: form.nomeEscola,
        cidade: form.cidade,
        estado: form.estado,
        telefone: form.telefone,
        whatsapp: form.whatsapp,
        responsavel: form.responsavel,
        plano: planoSelecionado,
      })
    })
    const result = await escolaRes.json()

    if (!result.ok) {
      setErro('Erro: ' + result.message)
      setSalvando(false)
      return
    }

    // Criar assinatura Asaas e redirecionar para pagamento
    try {
      const asaasRes = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escolaId: result.escolaId,
          plano: planoSelecionado,
          nome: form.responsavel,
          email: '',
          whatsapp: form.whatsapp,
        })
      })
      const asaasData = await asaasRes.json()
      if (asaasData.ok && asaasData.paymentLink) {
        window.location.href = asaasData.paymentLink
        return
      }
      console.error('Asaas response:', asaasData)
    } catch (e) {
      console.error('Asaas error:', e)
    }

    // Fallback: ir para dashboard
    window.location.href = '/dashboard'
  }

  const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
  const stepLabels = ['Dados da Escola', 'Dados do Responsável', 'Escolha o Plano']

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 14px', boxShadow: '0 0 20px rgba(57,255,20,0.15)' }}>
            ⚽
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: '28px', color: neon, margin: '0 0 4px', letterSpacing: '-0.5px' }}>GestaoFC</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Configure sua escolinha</p>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: gold, fontFamily: syne, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Etapa {step} de 3
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{stepLabels[step - 1]}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(s => (
              <div
                key={s}
                style={{ flex: 1, height: '3px', borderRadius: '4px', background: step >= s ? neon : 'rgba(255,255,255,0.1)', boxShadow: step >= s ? '0 0 8px rgba(57,255,20,0.4)' : 'none', transition: 'all 0.3s' }}
              />
            ))}
          </div>
        </div>

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>❌ {erro}</p>
          </div>
        )}

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
                onClick={() => { if (!form.responsavel || !form.whatsapp) { setErro('Preencha os campos obrigatórios.'); return }; setErro(''); setStep(3) }}
                style={{ flex: 2, background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', padding: '15px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(57,255,20,0.25)' }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                💳 Escolha seu plano
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>
                Você pode mudar de plano a qualquer momento.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PLANOS.map(p => {
                  const selecionado = planoSelecionado === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlanoSelecionado(p.id)}
                      style={{ width: '100%', background: selecionado ? p.cor : 'rgba(255,255,255,0.02)', border: `2px solid ${selecionado ? p.corBorder : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative' }}
                    >
                      {p.popular && (
                        <span style={{ position: 'absolute', top: '-8px', right: '12px', background: '#FF6B00', color: '#fff', fontSize: '9px', fontWeight: 800, fontFamily: syne, padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                          POPULAR
                        </span>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '15px', color: selecionado ? (p.id === 'ELITE' ? '#FFD700' : p.id === 'PRO' ? '#FF6B00' : '#fff') : 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>
                            {p.nome}
                          </p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>{p.limite}</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                            {p.destaques.map(d => (
                              <span key={d} style={{ fontSize: '10px', color: selecionado ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{d}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                          <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: selecionado ? (p.id === 'ELITE' ? '#FFD700' : p.id === 'PRO' ? '#FF6B00' : '#fff') : 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1 }}>
                            R${p.preco}
                          </p>
                          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>/mês</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(2)}
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

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '24px' }}>
          GestaoFC · Gestão inteligente de escolinhas
        </p>
      </div>
    </div>
  )
}