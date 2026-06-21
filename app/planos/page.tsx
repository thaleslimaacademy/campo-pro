'use client'
import { useState } from 'react'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const plans = [
  {
    id: 'basico', name: 'Basico', monthly: 79, annual: 65,
    desc: 'Para quem esta comecando a organizar a escolinha',
    limite: 'Ate 50 atletas',
    color: '#7DD3FC', badge: null, destaque: false,
    features: [
      { ok: true,  label: 'Ate 50 atletas' },
      { ok: true,  label: '1 usuario admin' },
      { ok: true,  label: 'Ate 3 turmas' },
      { ok: true,  label: 'Controle de presenca' },
      { ok: true,  label: 'Mensalidades basicas' },
      { ok: false, label: 'WhatsApp automatico' },
      { ok: false, label: 'App dos pais' },
      { ok: false, label: 'Multiplas modalidades' },
      { ok: false, label: 'Dashboard financeiro' },
      { ok: false, label: 'Premiacoes e conquistas' },
    ],
  },
  {
    id: 'pro', name: 'Pro', monthly: 129, annual: 107,
    desc: 'Para academias em crescimento que querem profissionalizar',
    limite: 'Ate 150 atletas',
    color: '#00BFFF', badge: 'MAIS POPULAR', destaque: true,
    features: [
      { ok: true,  label: 'Ate 150 atletas' },
      { ok: true,  label: '3 usuarios (admin + professores)' },
      { ok: true,  label: 'Turmas ilimitadas' },
      { ok: true,  label: 'WhatsApp automatico' },
      { ok: true,  label: 'Dashboard financeiro' },
      { ok: true,  label: 'Ate 3 modalidades' },
      { ok: true,  label: 'Campeonatos e convocacoes' },
      { ok: true,  label: 'Relatorios PDF' },
      { ok: false, label: 'App dos pais' },
      { ok: false, label: 'Premiacoes e conquistas' },
    ],
  },
  {
    id: 'elite', name: 'Elite', monthly: 199, annual: 165,
    desc: 'O sistema operacional completo para sua academia',
    limite: 'Atletas ilimitados',
    color: '#FFD700', badge: 'COMPLETO', destaque: false,
    features: [
      { ok: true, label: 'Atletas ilimitados' },
      { ok: true, label: 'Usuarios ilimitados' },
      { ok: true, label: 'Todas as modalidades' },
      { ok: true, label: 'WhatsApp automatico' },
      { ok: true, label: 'App dos pais' },
      { ok: true, label: 'Premiacoes e conquistas' },
      { ok: true, label: 'Dashboard financeiro avancado' },
      { ok: true, label: 'Biblioteca de treinamentos' },
      { ok: true, label: 'Multiplos nucleos/unidades' },
      { ok: true, label: 'Suporte prioritario' },
    ],
  },
]

export default function PlanosPage() {
  const [anual, setAnual] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#F0F4FF', fontFamily: INTER }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;900&family=Inter:wght@400;500;600&display=swap" />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,16,0.95)', borderBottom: '1px solid rgba(65,105,225,0.2)', backdropFilter: 'blur(12px)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 18, color: '#F0F4FF', textTransform: 'uppercase', letterSpacing: 1 }}>GestaoFC</span>
        </a>
        <a href="/login" style={{ background: 'rgba(65,105,225,0.15)', color: '#7DD3FC', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(65,105,225,0.3)' }}>Entrar</a>
      </nav>

      {/* HEADER */}
      <div style={{ padding: '64px 24px 48px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(65,105,225,0.12)', border: '1px solid rgba(65,105,225,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 11, color: '#7DD3FC', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
          Planos e Precos
        </div>
        <h1 style={{ fontFamily: SYNE, fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: '#F0F4FF', marginBottom: 12, lineHeight: 1.1 }}>
          Escolha o plano <span style={{ color: '#4169E1' }}>certo para sua academia</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.5)', marginBottom: 32, lineHeight: 1.6 }}>
          Tudo que voce precisa para gerenciar, crescer e profissionalizar sua academia de futebol.
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: anual ? 'rgba(240,244,255,0.35)' : '#F0F4FF', fontWeight: 500 }}>Mensal</span>
          <button onClick={() => setAnual(!anual)} style={{ width: 52, height: 28, borderRadius: 14, background: anual ? '#4169E1' : '#1A1A28', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
            <span style={{ position: 'absolute', top: 4, left: anual ? 26 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', display: 'block' }} />
          </button>
          <span style={{ fontSize: 14, color: anual ? '#F0F4FF' : 'rgba(240,244,255,0.35)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            Anual
            <span style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>-18%</span>
          </span>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ background: '#0F0F18', border: `2px solid ${plan.destaque ? '#4169E1' : plan.id === 'elite' ? '#FFD70033' : '#1A1A28'}`, borderRadius: 20, padding: '28px 24px', position: 'relative', boxShadow: plan.destaque ? '0 0 40px rgba(65,105,225,0.15)' : 'none', display: 'flex', flexDirection: 'column', marginTop: plan.destaque ? 0 : 0 }}>
            {plan.badge && (
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: plan.destaque ? '#4169E1' : '#FFD700', color: plan.id === 'elite' ? '#0A0E1A' : '#fff', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap', fontFamily: SYNE, letterSpacing: 0.5 }}>
                {plan.badge}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: SYNE, fontSize: 26, fontWeight: 900, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', lineHeight: 1.5 }}>{plan.desc}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 14, color: 'rgba(240,244,255,0.4)', marginBottom: 8 }}>R$</span>
                <span style={{ fontFamily: SYNE, fontSize: 56, fontWeight: 900, color: '#F0F4FF', lineHeight: 1 }}>{anual ? plan.annual : plan.monthly}</span>
                <span style={{ fontSize: 13, color: 'rgba(240,244,255,0.35)', marginBottom: 10 }}>/mes</span>
              </div>
              {anual && <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.3)', marginTop: 4 }}>Cobrado anualmente — R$ {(plan.annual) * 12}/ano</div>}
            </div>

            <a href={`/cadastro?plano=${plan.id}${anual ? '&periodo=anual' : ''}`} style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 10, fontFamily: SYNE, fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8, letterSpacing: 0.5, background: plan.destaque ? '#4169E1' : plan.id === 'elite' ? '#FFD700' : 'rgba(65,105,225,0.12)', color: plan.id === 'elite' ? '#0A0E1A' : '#fff', border: plan.id === 'basico' ? '1px solid rgba(65,105,225,0.25)' : 'none' }}>
              Comecar agora
            </a>
            <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.25)', textAlign: 'center', marginBottom: 20 }}>{plan.limite}</p>

            <div style={{ borderTop: '1px solid #1A1A28', paddingTop: 20, flex: 1 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: f.ok ? 'rgba(74,222,128,0.12)' : 'rgba(255,107,107,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {f.ok
                      ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    }
                  </div>
                  <span style={{ fontSize: 13, color: f.ok ? 'rgba(240,244,255,0.8)' : 'rgba(240,244,255,0.2)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: 'rgba(240,244,255,0.25)', fontSize: 13, paddingBottom: 48 }}>
        Sem fidelidade no plano mensal · Cancele quando quiser
      </p>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}
