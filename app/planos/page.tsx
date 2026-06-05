'use client'

import { useState } from 'react'

const planos = [
  {
    id: 'basico',
    nome: 'Básico',
    popular: false,
    precoMensal: 49,
    precoAnual: 39,
    atletasMax: 30,
    acento: 'rgba(255,255,255,0.5)',
    acentoBg: 'rgba(255,255,255,0.04)',
    acentoBorder: 'rgba(255,255,255,0.1)',
    recursos: [
      { nome: 'Até 30 atletas', ok: true },
      { nome: '2 turmas', ok: true },
      { nome: 'Financeiro e Pix', ok: true },
      { nome: 'Presença', ok: true },
      { nome: 'Matrículas online', ok: true },
      { nome: 'Área dos pais', ok: true },
      { nome: 'Relatórios PDF', ok: false },
      { nome: 'Avaliação física', ok: false },
      { nome: 'Campeonatos', ok: false },
      { nome: 'Convocações', ok: false },
      { nome: 'WhatsApp automático', ok: false },
      { nome: '1 usuário', ok: true },
      { nome: 'Suporte por email', ok: true },
    ]
  },
  {
    id: 'pro',
    nome: 'Pro',
    popular: true,
    precoMensal: 99,
    precoAnual: 79,
    atletasMax: 100,
    acento: '#39FF14',
    acentoBg: 'rgba(57,255,20,0.06)',
    acentoBorder: 'rgba(57,255,20,0.3)',
    recursos: [
      { nome: 'Até 100 atletas', ok: true },
      { nome: '5 turmas', ok: true },
      { nome: 'Financeiro e Pix', ok: true },
      { nome: 'Presença', ok: true },
      { nome: 'Matrículas online', ok: true },
      { nome: 'Área dos pais', ok: true },
      { nome: 'Relatórios PDF', ok: true },
      { nome: 'Avaliação física', ok: true },
      { nome: 'Campeonatos', ok: true },
      { nome: 'Convocações', ok: true },
      { nome: 'WhatsApp automático', ok: false },
      { nome: '3 usuários', ok: true },
      { nome: 'Suporte WhatsApp', ok: true },
    ]
  },
  {
    id: 'elite',
    nome: 'Elite',
    popular: false,
    precoMensal: 197,
    precoAnual: 157,
    atletasMax: 999,
    acento: '#D4AF37',
    acentoBg: 'rgba(212,175,55,0.06)',
    acentoBorder: 'rgba(212,175,55,0.3)',
    recursos: [
      { nome: 'Atletas ilimitados', ok: true },
      { nome: 'Turmas ilimitadas', ok: true },
      { nome: 'Financeiro e Pix', ok: true },
      { nome: 'Presença', ok: true },
      { nome: 'Matrículas online', ok: true },
      { nome: 'Área dos pais', ok: true },
      { nome: 'Relatórios PDF', ok: true },
      { nome: 'Avaliação física', ok: true },
      { nome: 'Campeonatos', ok: true },
      { nome: 'Convocações', ok: true },
      { nome: 'WhatsApp automático', ok: true },
      { nome: 'Usuários ilimitados', ok: true },
      { nome: 'Suporte prioritário', ok: true },
    ]
  }
]

export default function Planos() {
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')

  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const bg = 'linear-gradient(160deg,#0a1a06,#050505,#111003)'

  function assinar(planoId: string) {
    const plano = planos.find(p => p.id === planoId)
    const valor = periodo === 'mensal' ? plano?.precoMensal : plano?.precoAnual
    const msg = encodeURIComponent(
      'Olá! Quero assinar o plano ' + plano?.nome + ' do GestaoFC.\n\n' +
      'Plano: ' + plano?.nome + '\n' +
      'Período: ' + (periodo === 'mensal' ? 'Mensal' : 'Anual') + '\n' +
      'Valor: R$ ' + valor + (periodo === 'mensal' ? '/mês' : '/mês (cobrado anualmente)') + '\n\n' +
      'Aguardo as instruções de pagamento!'
    )
    window.open('https://wa.me/5534998168467?text=' + msg, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F0F0', fontFamily: 'Inter,sans-serif' }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '300px', height: '150px', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.15, background: neon }} />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 14px', boxShadow: '0 0 30px rgba(57,255,20,0.15)' }}>
            ⚽
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: '32px', color: neon, margin: '0 0 6px', letterSpacing: '-0.5px' }}>GestaoFC</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', margin: 0 }}>Gerencie sua escolinha com profissionalismo</p>
        </div>
      </div>

      <div style={{ padding: '0 20px 40px', maxWidth: '440px', margin: '0 auto' }}>

        {/* ── TOGGLE MENSAL/ANUAL ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={() => setPeriodo('mensal')}
              style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: syne, border: 'none', cursor: 'pointer', background: periodo === 'mensal' ? 'linear-gradient(135deg,#39FF14,#2bcc0f)' : 'transparent', color: periodo === 'mensal' ? '#050505' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: syne, border: 'none', cursor: 'pointer', background: periodo === 'anual' ? 'linear-gradient(135deg,#39FF14,#2bcc0f)' : 'transparent', color: periodo === 'anual' ? '#050505' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Anual
              <span style={{ background: 'rgba(57,255,20,0.15)', color: neon, fontSize: '10px', padding: '1px 6px', borderRadius: '20px', fontWeight: 800 }}>-20%</span>
            </button>
          </div>
        </div>

        {/* ── CARDS DE PLANO ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {planos.map(p => (
            <div
              key={p.id}
              style={{ position: 'relative', background: p.acentoBg, border: '1px solid ' + p.acentoBorder, borderRadius: '20px', padding: '24px', boxShadow: p.popular ? '0 0 30px ' + p.acento + '20' : 'none' }}
            >
              {/* Badge mais popular */}
              {p.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>
                  <span style={{ background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', fontSize: '10px', fontWeight: 900, fontFamily: syne, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(57,255,20,0.4)' }}>
                    MAIS POPULAR
                  </span>
                </div>
              )}

              {/* Nome + Preço */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: p.acento, margin: '0 0 4px' }}>{p.nome}</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    {p.atletasMax >= 999 ? 'Atletas ilimitados' : 'Até ' + p.atletasMax + ' atletas'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: syne, fontWeight: 900, fontSize: '32px', color: p.acento, margin: 0, lineHeight: 1 }}>
                    R$ {periodo === 'mensal' ? p.precoMensal : p.precoAnual}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>/mês</p>
                  {periodo === 'anual' && (
                    <p style={{ fontSize: '11px', color: p.acento, margin: '2px 0 0', fontWeight: 600 }}>R$ {(p.precoAnual * 12).toLocaleString('pt-BR')}/ano</p>
                  )}
                </div>
              </div>

              {/* Lista de recursos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {p.recursos.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: r.ok ? p.acento : 'rgba(255,255,255,0.2)', fontWeight: 700, flexShrink: 0, width: '16px' }}>{r.ok ? '✓' : '✗'}</span>
                    <span style={{ fontSize: '12px', color: r.ok ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}>{r.nome}</span>
                  </div>
                ))}
              </div>

              {/* Botão assinar */}
              <button
                onClick={() => assinar(p.id)}
                style={{ width: '100%', padding: '13px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', background: p.popular ? 'linear-gradient(135deg,#39FF14,#2bcc0f)' : 'rgba(255,255,255,0.07)', color: p.popular ? '#050505' : p.acento, boxShadow: p.popular ? '0 0 20px rgba(57,255,20,0.25)' : 'none', transition: 'all 0.2s' }}
              >
                📲 Assinar via WhatsApp
              </button>
            </div>
          ))}
        </div>

        {/* ── TRUST BADGES ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: neon, marginBottom: '12px' }}>✅ Pagamento seguro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['Pix ou cartão de crédito', 'Cancele quando quiser', 'Suporte em português', 'Dados seguros e criptografados'].map((item, i) => (
              <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>✅ {item}</p>
            ))}
          </div>
        </div>

        {/* ── SUPORTE ── */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '20px', marginBottom: '12px' }}>
          Dúvidas? Fale conosco pelo WhatsApp
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <a
            href="https://wa.me/5534998168467"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)', color: neon, padding: '12px 28px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', fontFamily: syne, textDecoration: 'none' }}
          >
            💬 Falar com suporte
          </a>
        </div>

      </div>
    </div>
  )
}
