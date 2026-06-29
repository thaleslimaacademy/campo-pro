import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,14,26,0.92)', borderBottom: '1px solid rgba(65,105,225,0.15)', backdropFilter: 'blur(12px)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icon-192.png" alt="GestãoFC" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 18, color: '#F0F4FF', letterSpacing: -0.5 }}>GestãoFC</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/planos" style={{ color: 'rgba(240,244,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Planos</Link>
            <Link href="/login" style={{ color: 'rgba(240,244,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Entrar</Link>
            <Link href="/sign-up?plano=pro" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 8, padding: '8px 18px', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(65,105,225,0.12)', border: '1px solid rgba(65,105,225,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: '#7DD3FC', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
          🎉 15 dias grátis · Sem cartão
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 1.1, letterSpacing: -1.5, margin: '0 0 20px' }}>
          Gestão inteligente<br />
          <span style={{ color: '#4169E1' }}>para sua escolinha</span><br />
          de futebol
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(240,244,255,0.6)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Controle atletas, presenças, mensalidades e muito mais. WhatsApp automático, app dos pais e relatórios — tudo em um só lugar.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up?plano=pro" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 12, padding: '16px 32px', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-block' }}>
            Começar 15 dias grátis
          </Link>
          <Link href="/planos" style={{ background: 'transparent', color: '#F0F4FF', borderRadius: 12, padding: '16px 32px', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, border: '1px solid rgba(240,244,255,0.15)', display: 'inline-block' }}>
            Ver planos
          </Link>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(240,244,255,0.35)' }}>Sem fidelidade · Cancele quando quiser</p>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, background: 'rgba(65,105,225,0.1)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(65,105,225,0.2)' }}>
          {[
            { n: '200+', l: 'Atletas gerenciados' },
            { n: '3', l: 'Escolinhas ativas' },
            { n: '100%', l: 'WhatsApp automático' },
            { n: '15 dias', l: 'Grátis para testar' },
          ].map(s => (
            <div key={s.n} style={{ background: '#0A0E1A', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 32, color: '#4169E1', marginBottom: 6 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 36, textAlign: 'center', marginBottom: 48, letterSpacing: -0.5 }}>
          Tudo que sua academia precisa
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { icon: '👥', title: 'Gestão de Atletas', desc: 'Cadastro completo, foto, avaliação física, histórico de presença e carteirinha digital.' },
            { icon: '💰', title: 'Financeiro Completo', desc: 'Mensalidades automáticas via PIX, cobranças manuais, baixa manual e relatórios de inadimplência.' },
            { icon: '📲', title: 'WhatsApp Automático', desc: 'Cobranças, convocações e notificações enviadas automaticamente pelo WhatsApp da sua escola.' },
            { icon: '👨‍👩‍👦', title: 'App dos Pais', desc: 'Portal exclusivo para responsáveis acompanharem presença, mensalidades e convocações.' },
            { icon: '🏆', title: 'Campeonatos', desc: 'Gerencie torneios, convocações, súmulas e placares direto no sistema.' },
            { icon: '🪪', title: 'Carteirinha Digital', desc: 'Carteirinha personalizada com QR Code, foto do atleta e cores da sua escola.' },
            { icon: '📊', title: 'Relatórios', desc: 'Dashboard financeiro, presença por período e relatórios para tomada de decisão.' },
            { icon: '🏫', title: 'Multi-escola', desc: 'Gerencie múltiplas unidades com dados isolados e acesso por escola.' },
          ].map(f => (
            <div key={f.title} style={{ background: '#0D1220', border: '1px solid rgba(240,244,255,0.07)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, marginBottom: 8, color: '#F0F4FF' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS PREVIEW */}
      <section style={{ background: '#0D1220', borderTop: '1px solid rgba(65,105,225,0.15)', borderBottom: '1px solid rgba(65,105,225,0.15)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 36, marginBottom: 12, letterSpacing: -0.5 }}>
            Planos para todos os tamanhos
          </h2>
          <p style={{ color: 'rgba(240,244,255,0.5)', fontSize: 16, marginBottom: 48 }}>Comece grátis por 15 dias. Sem cartão de crédito.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { id: 'basico', label: 'Básico', preco: 79, cor: '#7DD3FC', desc: 'Para começar', badge: null },
              { id: 'pro', label: 'Pro', preco: 129, cor: '#4169E1', desc: 'Mais popular', badge: 'POPULAR' },
              { id: 'elite', label: 'Elite', preco: 199, cor: '#FFD700', desc: 'Completo', badge: 'COMPLETO' },
            ].map(p => (
              <div key={p.id} style={{ background: '#0A0E1A', border: `2px solid ${p.badge ? p.cor : 'rgba(240,244,255,0.08)'}`, borderRadius: 16, padding: 24, position: 'relative', boxShadow: p.badge ? `0 0 24px ${p.cor}18` : undefined }}>
                {p.badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.cor, color: p.cor === '#FFD700' ? '#0A0E1A' : '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 20, fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}>{p.badge}</div>}
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: p.cor, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginBottom: 16 }}>{p.desc}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 36, color: '#F0F4FF', marginBottom: 20 }}>
                  R${p.preco}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(240,244,255,0.4)' }}>/mês</span>
                </div>
                <Link href={`/sign-up?plano=${p.id}`} style={{ display: 'block', background: p.id === 'pro' ? p.cor : 'transparent', color: p.id === 'pro' ? '#fff' : p.cor, border: `1px solid ${p.cor}`, borderRadius: 10, padding: '12px', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 40, letterSpacing: -1, marginBottom: 16 }}>
          Pronto para profissionalizar<br />
          <span style={{ color: '#4169E1' }}>sua escolinha?</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.5)', marginBottom: 32, lineHeight: 1.7 }}>
          Junte-se a escolinhas que já usam o GestãoFC para organizar atletas, cobranças e comunicação.
        </p>
        <Link href="/sign-up?plano=pro" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 14, padding: '18px 40px', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 18, display: 'inline-block', letterSpacing: -0.3 }}>
          Começar 15 dias grátis ⚽
        </Link>
        <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(240,244,255,0.3)' }}>Sem cartão · Sem fidelidade · Cancele quando quiser</p>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(240,244,255,0.07)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.3)', margin: 0 }}>
          © 2026 GestãoFC · <Link href="/privacidade" style={{ color: 'rgba(240,244,255,0.3)', textDecoration: 'none' }}>Privacidade</Link> · <Link href="/planos" style={{ color: 'rgba(240,244,255,0.3)', textDecoration: 'none' }}>Planos</Link>
        </p>
      </footer>

    </div>
  )
}
