'use client'
import { useState, useEffect } from 'react'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

export default function LandingPage() {
  const [anual, setAnual] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const plans = [
    {
      id: 'basico', name: 'Basico', monthly: 79, annual: 65,
      desc: 'Para quem esta comecando a organizar a escolinha',
      limite: 'Ate 50 atletas',
      color: '#2EA866', badge: null,
      features: [
        { ok: true,  label: 'Ate 50 atletas' },
        { ok: true,  label: '1 usuario admin' },
        { ok: true,  label: 'Ate 3 turmas' },
        { ok: true,  label: 'Controle de presenca' },
        { ok: true,  label: 'Mensalidades basicas' },
        { ok: false, label: 'WhatsApp automatico' },
        { ok: false, label: 'App dos pais' },
        { ok: false, label: 'Multiplas modalidades' },
        { ok: false, label: 'Relatorios e dashboard' },
        { ok: false, label: 'Premiações e conquistas' },
      ],
    },
    {
      id: 'pro', name: 'Pro', monthly: 129, annual: 107,
      desc: 'Para academias em crescimento que querem profissionalizar',
      limite: 'Ate 150 atletas',
      color: '#23874F', badge: 'MAIS POPULAR',
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
        { ok: false, label: 'Premiações e conquistas' },
      ],
    },
    {
      id: 'elite', name: 'Elite', monthly: 199, annual: 165,
      desc: 'O sistema operacional completo para sua academia',
      limite: 'Atletas ilimitados',
      color: '#B7791F', badge: 'COMPLETO',
      features: [
        { ok: true, label: 'Atletas ilimitados' },
        { ok: true, label: 'Usuarios ilimitados' },
        { ok: true, label: 'Todas as modalidades' },
        { ok: true, label: 'WhatsApp automatico' },
        { ok: true, label: 'App dos pais' },
        { ok: true, label: 'Premiações e conquistas' },
        { ok: true, label: 'Dashboard financeiro avancado' },
        { ok: true, label: 'Biblioteca de treinamentos' },
        { ok: true, label: 'Multiplos nucleos/unidades' },
        { ok: true, label: 'Suporte prioritario' },
      ],
    },
  ]

  const dores = [
    { icon: 'ti-clock', titulo: 'Horas perdidas todo mês', desc: 'Cobrando mensalidade por WhatsApp uma a uma, conferindo pagamentos manualmente e criando listas de presença no papel.' },
    { icon: 'ti-alert-triangle', titulo: 'Inadimplência fora de controle', desc: 'Sem visibilidade de quem pagou, quem está atrasado e quanto você está perdendo todo mês. A academia sangra dinheiro sem que você perceba.' },
    { icon: 'ti-device-mobile-off', titulo: 'Comunicação desorganizada', desc: 'Mensagens espalhadas em grupos de WhatsApp, pais sem informação sobre treinos, convocações e o desenvolvimento do filho.' },
    { icon: 'ti-puzzle', titulo: 'Várias ferramentas, nenhuma integrada', desc: 'Planilha para atletas, outro app para financeiro, grupo de WhatsApp para comunicação. Tudo separado, nada funcionando junto.' },
    { icon: 'ti-users', titulo: 'Sendo tudo ao mesmo tempo', desc: 'Você é professor, financeiro, secretário e administrador. O tempo que deveria ser dedicado a formar atletas é consumido por burocracia.' },
    { icon: 'ti-chart-bar-off', titulo: 'Sem dados para decidir', desc: 'Você não sabe quantos atletas tem hoje, qual a taxa de inadimplência, qual turma está crescendo. Você administra no escuro.' },
  ]

  const funcionalidades = [
    { icon: 'ti-credit-card', cor: '#16A34A', titulo: 'Cobrança automática', desc: 'Boletos gerados e enviados por WhatsApp automaticamente. O sistema cobra, você recebe.' },
    { icon: 'ti-check', cor: '#23874F', titulo: 'Presença digital', desc: 'Controle de frequência por turma em segundos. Relatório completo no final do mês.' },
    { icon: 'ti-message-circle', cor: '#4B5563', titulo: 'WhatsApp integrado', desc: 'Mensagens automáticas para pais sobre pagamentos, treinos, convocações e notícias da academia.' },
    { icon: 'ti-chart-bar', cor: '#B7791F', titulo: 'Dashboard financeiro', desc: 'Visualize em tempo real: receita prevista, recebida, inadimplência e ticket médio.' },
    { icon: 'ti-users', cor: '#C2410C', titulo: 'App dos pais', desc: 'Os pais acompanham o desenvolvimento, conquistas e avaliações físicas do filho direto no celular.' },
    { icon: 'ti-medal', cor: '#DB2777', titulo: 'Premiações e conquistas', desc: 'Sistema de conquistas que motiva os atletas e aumenta a retenção na sua academia.' },
    { icon: 'ti-run', cor: '#2EA866', titulo: 'Gestão de turmas', desc: 'Organize atletas por categoria, horário e modalidade. Controle total do seu elenco.' },
    { icon: 'ti-trophy', cor: '#7C3AED', titulo: 'Campeonatos', desc: 'Gerencie competicoes, convocacoes e resultados em um único lugar.' },
  ]

  const numeros = [
    { valor: '350+', label: 'Atletas gerenciados', cor: '#23874F' },
    { valor: '15h', label: 'Economizadas por semana', cor: '#16A34A' },
    { valor: '100%', label: 'Operação centralizada', cor: '#B7791F' },
    { valor: '0', label: 'Planilhas e papéis', cor: '#DB2777' },
  ]

  return (
    <div style={{ background: '#FFFFFF', color: '#1F2937', fontFamily: INTER, minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)', borderBottom: '1px solid rgba(46,168,102,0.2)', backdropFilter: 'blur(12px)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 18, color: '#1F2937', textTransform: 'uppercase', letterSpacing: 1 }}>GestaoFC</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/login" style={{ color: '#4B5563', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Entrar</a>
          <a href="/planos" style={{ background: '#2EA866', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', fontFamily: SYNE }}>Começar grátis</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'inline-block', background: 'rgba(46,168,102,0.15)', border: '1px solid rgba(46,168,102,0.4)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: '#4B5563', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>
          Sistema de gestão para escolinhas de futebol
        </div>
        <h1 style={{ fontFamily: SYNE, fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, color: '#1F2937' }}>
          Pare de apagar incêndios.<br />
          <span style={{ color: '#2EA866' }}>Comece a liderar</span> sua academia.
        </h1>
        <p style={{ fontSize: 18, color: '#374151', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px' }}>
          Menos tempo com cobranças, planilhas e WhatsApp manual. Mais tempo formando atletas. GestaoFC centraliza toda a operação da sua escolinha em um único sistema.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/planos" style={{ background: '#2EA866', color: '#fff', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Começar agora
          </a>
          <a href="#funcionalidades" style={{ background: 'rgba(46,168,102,0.1)', color: '#4B5563', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(46,168,102,0.3)' }}>
            Ver funcionalidades
          </a>
        </div>
        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 16 }}>Sem fidelidade no plano mensal. Cancele quando quiser.</p>
      </section>

      {/* NUMEROS */}
      <section style={{ background: 'rgba(46,168,102,0.06)', borderTop: '1px solid rgba(46,168,102,0.15)', borderBottom: '1px solid rgba(46,168,102,0.15)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, textAlign: 'center' }}>
          {numeros.map(n => (
            <div key={n.label}>
              <div style={{ fontFamily: SYNE, fontSize: 42, fontWeight: 900, color: n.cor, lineHeight: 1 }}>{n.valor}</div>
              <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{n.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DORES */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#1F2937', marginBottom: 16 }}>
            Você se identifica com alguma dessas situações?
          </h2>
          <p style={{ fontSize: 16, color: '#374151', maxWidth: 560, margin: '0 auto' }}>
            Gestores e treinadores de todo o Brasil enfrentam os mesmos problemas todo dia.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {dores.map(d => (
            <div key={d.titulo} style={{ background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 14, padding: '24px 20px', display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={'ti ' + d.icon} style={{ fontSize: 20, color: '#DC2626' }} />
              </div>
              <div>
                <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: '#1F2937', marginBottom: 6 }}>{d.titulo}</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSICAO */}
      <section style={{ background: '#FFFFFF', borderBottom: '1px solid #E3E8E5', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#1F2937', marginBottom: 16, lineHeight: 1.2 }}>
            O GestaoFC foi criado por um treinador que viveu esses problemas.
          </h2>
          <p style={{ fontSize: 16, color: '#1F2937', lineHeight: 1.7, marginBottom: 24 }}>
            Thales Cruz, ex-jogador profissional com passagens por Brasil, Japão (Roasso Kumamoto), Tailândia e Indonésia, fundou a TLFA em Iturama-MG após encerrar sua carreira. Viveu na pele a falta de um sistema feito para a realidade das escolinhas brasileiras. O GestaoFC nasceu dessa necessidade real.
          </p>
          <div style={{ display: 'inline-block', background: '#EEF1EF', borderRadius: 12, padding: '12px 24px', fontSize: 15, color: '#1F2937', fontStyle: 'italic', lineHeight: 1.6 }}>
            "Menos tempo administrando, mais tempo formando atletas."
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#1F2937', marginBottom: 16 }}>
            Tudo que sua academia precisa,<br /><span style={{ color: '#2EA866' }}>em um único lugar.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#374151', maxWidth: 560, margin: '0 auto' }}>
            Não é mais um app. É o sistema operacional completo da sua escolinha.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {funcionalidades.map(f => (
            <div key={f.titulo} style={{ background: '#FFFFFF', border: '1px solid #E3E8E5', borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: f.cor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <i className={'ti ' + f.icon} style={{ fontSize: 22, color: f.cor }} />
              </div>
              <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: '#1F2937', marginBottom: 8 }}>{f.titulo}</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{ padding: '80px 24px', background: 'rgba(46,168,102,0.04)', borderTop: '1px solid rgba(46,168,102,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: SYNE, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#1F2937', marginBottom: 12 }}>
              Planos e preços
            </h2>
            <p style={{ fontSize: 16, color: '#374151', marginBottom: 28 }}>Sem fidelidade no mensal. Cancele quando quiser.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, color: anual ? '#6B7280' : '#1F2937', fontWeight: 500 }}>Mensal</span>
              <button onClick={() => setAnual(!anual)} style={{ width: 52, height: 28, borderRadius: 14, background: anual ? '#2EA866' : '#F3F5F4', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
                <span style={{ position: 'absolute', top: 4, left: anual ? 26 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', display: 'block' }} />
              </button>
              <span style={{ fontSize: 14, color: anual ? '#1F2937' : '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                Anual
                <span style={{ background: 'rgba(74,222,128,0.15)', color: '#16A34A', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>-18%</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ background: '#FFFFFF', border: `2px solid ${plan.id === 'pro' ? '#2EA866' : plan.id === 'elite' ? '#B7791F' : '#E3E8E5'}`, borderRadius: 20, padding: '28px 24px', position: 'relative', boxShadow: plan.id === 'pro' ? '0 0 40px rgba(46,168,102,0.15)' : 'none', display: 'flex', flexDirection: 'column' }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: plan.id === 'pro' ? '#2EA866' : '#FFD700', color: plan.id === 'elite' ? '#1F2937' : '#fff', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap', fontFamily: SYNE }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: SYNE, fontSize: 24, fontWeight: 900, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{plan.desc}</div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>R$</span>
                    <span style={{ fontFamily: SYNE, fontSize: 52, fontWeight: 900, color: '#1F2937', lineHeight: 1 }}>{anual ? plan.annual : plan.monthly}</span>
                    <span style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>/mes</span>
                  </div>
                  {anual && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Cobrado anualmente — R$ {(anual ? plan.annual : plan.monthly) * 12}/ano</div>}
                </div>
                <a href={`/cadastro?plano=${plan.id}${anual ? '&periodo=anual' : ''}`} style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 10, fontFamily: SYNE, fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8, background: plan.id === 'pro' ? '#2EA866' : plan.id === 'elite' ? '#FFD700' : 'rgba(46,168,102,0.15)', color: plan.id === 'elite' ? '#1F2937' : '#fff', border: plan.id === 'basico' ? '1px solid rgba(46,168,102,0.3)' : 'none' }}>
                  Começar agora
                </a>
                <p style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>{plan.limite}</p>
                <div style={{ borderTop: '1px solid #E3E8E5', paddingTop: 20, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: f.ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,107,107,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {f.ok
                          ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        }
                      </div>
                      <span style={{ fontSize: 13, color: f.ok ? '#1F2937' : '#9CA3AF' }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontFamily: SYNE, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#1F2937', marginBottom: 16, lineHeight: 1.2 }}>
          Sua academia merece um sistema<br /><span style={{ color: '#2EA866' }}>feito para vencer.</span>
        </h2>
        <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.7, marginBottom: 36 }}>
          Junte-se aos gestores que já pararam de perder tempo com burocracia e passaram a focar no que importa: formar atletas e crescer.
        </p>
        <a href="/planos" style={{ display: 'inline-block', background: '#2EA866', color: '#fff', padding: '16px 40px', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Começar agora gratis
        </a>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>Sem cartão de crédito para começar.</p>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E3E8E5', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <img src="/gestaofc-icon.svg" alt="GestaoFC" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: '#1F2937', textTransform: 'uppercase', letterSpacing: 1 }}>GestaoFC</span>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>O sistema operacional para escolinhas de futebol. Feito no Brasil, para o futebol brasileiro.</p>
      </footer>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } html { scroll-behavior: smooth; }`}</style>
    </div>
  )
}
