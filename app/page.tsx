import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', color: '#F0F4FF', fontFamily: INTER, overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,14,26,0.95)', borderBottom: '1px solid rgba(65,105,225,0.12)', backdropFilter: 'blur(16px)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8 }}>
          <div className="flex-col sm:flex-row sm:items-center" style={{ display: 'flex', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <img src="/icon-192.png" alt="GestãoFC" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
              <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 17, color: '#F0F4FF', letterSpacing: -0.5, whiteSpace: 'nowrap' }}>GestãoFC</span>
            </div>
            <Link href="/login" className="sm:ml-4" style={{ color: 'rgba(240,244,255,0.55)', textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap' }}>Entrar</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <Link href="#funcionalidades" className="hidden sm:inline" style={{ color: 'rgba(240,244,255,0.55)', textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap' }}>Funcionalidades</Link>
            <Link href="#planos" className="hidden sm:inline" style={{ color: 'rgba(240,244,255,0.55)', textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap' }}>Planos</Link>
            <Link href="/sign-up?plano=pro" className="hidden sm:inline-block" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 8, padding: '8px 20px', textDecoration: 'none', fontFamily: SYNE, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
              Teste grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 72px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,214,122,0.1)', border: '1px solid rgba(0,214,122,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 32 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00D67A', display: 'inline-block' }}></span>
          <span style={{ fontSize: 12, color: '#00D67A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>15 dias grátis · sem cartão</span>
        </div>

        <h1 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 'clamp(30px, 7vw, 68px)', lineHeight: 1.05, letterSpacing: -2, margin: '0 0 24px', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto', overflowWrap: 'break-word' }}>
          Sua escolinha no controle.<br />
          <span style={{ color: '#4169E1' }}>Cobrança automática.</span><br />
          Zero inadimplência.
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(240,244,255,0.55)', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.75 }}>
          GestãoFC cuida das mensalidades, envia cobranças no WhatsApp e dá baixa automática quando o pai paga. Você foca no que importa: o futebol.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/sign-up?plano=pro" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 12, padding: '16px 36px', textDecoration: 'none', fontFamily: SYNE, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.3, display: 'inline-block', boxShadow: '0 0 40px rgba(65,105,225,0.35)' }}>
            Começar 15 dias grátis ⚽
          </Link>
          <Link href="#demo" style={{ background: 'transparent', color: '#F0F4FF', borderRadius: 12, padding: '16px 28px', textDecoration: 'none', fontFamily: SYNE, fontWeight: 700, fontSize: 15, border: '1px solid rgba(240,244,255,0.12)', display: 'inline-block' }}>
            Ver como funciona →
          </Link>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.28)' }}>Sem fidelidade · cancele quando quiser</p>
      </section>

      {/* DOR — PROBLEMA REAL */}
      <section style={{ background: 'rgba(65,105,225,0.04)', borderTop: '1px solid rgba(65,105,225,0.1)', borderBottom: '1px solid rgba(65,105,225,0.1)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#4169E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Você se identifica?</p>
          <h2 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: -0.8, marginBottom: 48, lineHeight: 1.2 }}>
            Planilha, caderninho e cobrança no WhatsApp<br />não escalaram com você
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, textAlign: 'left' }}>
            {[
              { emoji: '😰', texto: 'Você lembra de cobrar o pai no final do mês mas esquece quem já pagou' },
              { emoji: '📋', texto: 'Controla tudo em planilha e gasta horas toda virada de mês' },
              { emoji: '💸', texto: 'Alguns alunos ficam meses sem pagar e você só descobre depois' },
              { emoji: '📱', texto: 'Manda mensagem de cobrança manualmente para cada responsável' },
            ].map(item => (
              <div key={item.emoji} style={{ background: '#0D1220', border: '1px solid rgba(240,244,255,0.06)', borderRadius: 12, padding: '20px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.6)', lineHeight: 1.6, margin: 0 }}>{item.texto}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, padding: '20px 28px', background: 'rgba(0,214,122,0.06)', border: '1px solid rgba(0,214,122,0.2)', borderRadius: 12, display: 'inline-block' }}>
            <p style={{ fontSize: 16, color: '#00D67A', fontWeight: 700, margin: 0 }}>O GestãoFC resolve tudo isso automaticamente. ✓</p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="demo" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 13, color: '#4169E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 12 }}>Como funciona</p>
        <h2 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 'clamp(26px, 4vw, 42px)', textAlign: 'center', letterSpacing: -0.8, marginBottom: 56, lineHeight: 1.2 }}>
          Configure uma vez.<br />O sistema trabalha por você.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            {
              num: '01', titulo: 'Cadastre seus atletas',
              desc: 'Importe de uma planilha ou cadastre um por um. O sistema já vincula o responsável, define o valor da mensalidade e o dia de vencimento.',
              detalhe: 'Importação em massa · Pré-matrícula online · Carteirinha digital',
            },
            {
              num: '02', titulo: 'PIX gerado automaticamente',
              desc: 'Todo mês, no dia certo de cada atleta, o sistema gera o PIX e envia para o WhatsApp do responsável. Sem você fazer nada.',
              detalhe: 'Integração Asaas · PIX com QR Code · Cobrança no nome da escola',
            },
            {
              num: '03', titulo: 'Lembretes e reemissão automática',
              desc: '3 dias antes: lembrete com link de pagamento. No dia: reforço. Atrasou? Sistema reemite com multa e juros e envia novo WhatsApp.',
              detalhe: 'D-3 lembrete · D+1 multa automática · D+4 e D+10 avisos',
            },
            {
              num: '04', titulo: 'Baixa automática e recibo',
              desc: 'Quando o pai paga, o sistema detecta e marca como pago automaticamente. Recibo gerado com um clique. Caixa sempre atualizado.',
              detalhe: 'Webhook Asaas · Baixa manual com cancelamento no Asaas · PDF do recibo',
            },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 32, padding: '32px 0', borderBottom: i < 3 ? '1px solid rgba(240,244,255,0.06)' : undefined, alignItems: 'start' }}>
              <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 48, color: 'rgba(65,105,225,0.25)', lineHeight: 1 }}>{step.num}</div>
              <div>
                <h3 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 22, color: '#F0F4FF', marginBottom: 10, letterSpacing: -0.3 }}>{step.titulo}</h3>
                <p style={{ fontSize: 15, color: 'rgba(240,244,255,0.55)', lineHeight: 1.7, marginBottom: 12 }}>{step.desc}</p>
                <p style={{ fontSize: 12, color: '#4169E1', fontWeight: 600 }}>{step.detalhe}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" style={{ background: '#0D1220', borderTop: '1px solid rgba(65,105,225,0.1)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 13, color: '#4169E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginBottom: 12 }}>Módulos inclusos</p>
          <h2 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 'clamp(26px, 4vw, 38px)', textAlign: 'center', letterSpacing: -0.5, marginBottom: 48, lineHeight: 1.2 }}>
            Tudo que sua escolinha precisa
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {[
              { icon: '💰', titulo: 'Financeiro completo', desc: 'PIX automático, baixa manual, extrato, recibos PDF e inadimplência em tempo real' },
              { icon: '📲', titulo: 'WhatsApp automático', desc: 'Cobranças, lembretes D-3, reemissão com multa e avisos de atraso automáticos' },
              { icon: '👥', titulo: 'Gestão de atletas', desc: 'Cadastro, foto, turmas, categorias, presença e carteirinha digital com QR Code' },
              { icon: '👨‍👩‍👦', titulo: 'Portal dos pais', desc: 'Responsáveis acompanham presença e mensalidades com link exclusivo, sem precisar de app' },
              { icon: '📋', titulo: 'Pré-matrícula online', desc: 'Link público de matrícula. O admin aprova, define turma e gera cobrança na mesma tela' },
              { icon: '🏆', titulo: 'Campeonatos', desc: 'Convocações, listas de jogadores e controle de torneios integrado ao cadastro' },
              { icon: '📊', titulo: 'Dashboard financeiro', desc: 'Receita do mês, inadimplentes, evolução e ranking de devedores' },
              { icon: '🏫', titulo: 'Multi-unidade', desc: 'Gerencie Alexandrita, Iturama e outras unidades com dados completamente isolados' },
            ].map(f => (
              <div key={f.titulo} style={{ background: '#0A0E1A', border: '1px solid rgba(240,244,255,0.06)', borderRadius: 14, padding: 22, transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 15, color: '#F0F4FF', marginBottom: 6 }}>{f.titulo}</h3>
                <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#4169E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 40 }}>Já em uso</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: 'rgba(65,105,225,0.12)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(65,105,225,0.2)', marginBottom: 64 }}>
          {[
            { n: '200+', l: 'Atletas gerenciados' },
            { n: 'R$0', l: 'Cobranças esquecidas' },
            { n: '100%', l: 'PIX com baixa automática' },
            { n: '2', l: 'Unidades ativas' },
          ].map(s => (
            <div key={s.n} style={{ background: '#0A0E1A', padding: '32px 20px' }}>
              <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 36, color: '#4169E1', marginBottom: 6 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <blockquote style={{ background: '#0D1220', border: '1px solid rgba(65,105,225,0.2)', borderLeft: '4px solid #4169E1', borderRadius: 12, padding: '28px 32px', textAlign: 'left', margin: '0 auto', maxWidth: 640 }}>
          <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.75)', lineHeight: 1.7, margin: '0 0 16px', fontStyle: 'italic' }}>
            "Antes eu passava o final do mês inteiro cobrando um por um no WhatsApp. Agora o sistema faz isso sozinho e eu só vejo quem pagou e quem não pagou."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1A3FA8,#4169E1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, color: '#fff', fontSize: 16 }}>T</div>
            <div>
              <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: '#F0F4FF', margin: 0 }}>Thales Lima</p>
              <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', margin: 0 }}>TLFA — Iturama e Alexandrita, MG</p>
            </div>
          </div>
        </blockquote>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{ background: '#0D1220', borderTop: '1px solid rgba(65,105,225,0.1)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#4169E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Preços</p>
          <h2 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 'clamp(26px, 4vw, 42px)', letterSpacing: -0.8, marginBottom: 12 }}>Planos para todos os tamanhos</h2>
          <p style={{ color: 'rgba(240,244,255,0.45)', fontSize: 15, marginBottom: 48 }}>15 dias grátis em qualquer plano. Sem cartão de crédito.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { id: 'basico', label: 'Básico', preco: 79, destaque: false, cor: '#7DD3FC', items: ['Até 50 atletas', 'PIX automático', 'WhatsApp de cobrança', 'App dos pais', '1 unidade'] },
              { id: 'pro', label: 'Pro', preco: 129, destaque: true, cor: '#4169E1', items: ['Até 150 atletas', 'Tudo do Básico', 'Campeonatos', 'Relatórios avançados', 'Multi-turma'] },
              { id: 'elite', label: 'Elite', preco: 199, destaque: false, cor: '#FFD700', items: ['Atletas ilimitados', 'Tudo do Pro', 'Multi-unidade', 'Suporte prioritário', 'Personalização'] },
            ].map(p => (
              <div key={p.id} style={{ background: '#0A0E1A', border: `2px solid ${p.destaque ? p.cor : 'rgba(240,244,255,0.08)'}`, borderRadius: 18, padding: '32px 24px', position: 'relative', boxShadow: p.destaque ? `0 0 40px ${p.cor}20` : undefined }}>
                {p.destaque && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: p.cor, color: '#fff', fontSize: 10, fontWeight: 900, padding: '4px 16px', borderRadius: 20, fontFamily: SYNE, whiteSpace: 'nowrap', letterSpacing: 1 }}>MAIS POPULAR</div>}
                <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 24, color: p.cor, marginBottom: 6 }}>{p.label}</div>
                <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 42, color: '#F0F4FF', marginBottom: 6 }}>
                  R${p.preco}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(240,244,255,0.35)' }}>/mês</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 24px', textAlign: 'left' }}>
                  {p.items.map(item => (
                    <li key={item} style={{ fontSize: 14, color: 'rgba(240,244,255,0.65)', padding: '6px 0', borderBottom: '1px solid rgba(240,244,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#00D67A', fontWeight: 700 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <Link href={`/sign-up?plano=${p.id}`} style={{ display: 'block', background: p.destaque ? p.cor : 'transparent', color: p.destaque ? '#fff' : p.cor, border: `2px solid ${p.cor}`, borderRadius: 10, padding: '13px', textDecoration: 'none', fontFamily: SYNE, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.3)' }}>Todos os planos incluem PIX automático, WhatsApp de cobrança e App dos pais.</p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 'clamp(30px, 5vw, 52px)', letterSpacing: -1.2, marginBottom: 20, lineHeight: 1.1 }}>
          Chega de cobrar<br />
          <span style={{ color: '#4169E1' }}>na mão.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.5)', marginBottom: 36, lineHeight: 1.7 }}>
          O GestãoFC cobra, lembra, reemite e dá baixa — tudo no automático. Você cuida do que realmente importa.
        </p>
        <Link href="/sign-up?plano=pro" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 14, padding: '20px 48px', textDecoration: 'none', fontFamily: SYNE, fontWeight: 900, fontSize: 18, display: 'inline-block', letterSpacing: -0.3, boxShadow: '0 0 60px rgba(65,105,225,0.4)' }}>
          Começar 15 dias grátis ⚽
        </Link>
        <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(240,244,255,0.28)' }}>Sem cartão · Sem fidelidade · Cancele quando quiser</p>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(240,244,255,0.06)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icon-192.png" alt="GestãoFC" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: 'rgba(240,244,255,0.5)' }}>GestãoFC</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/privacidade" style={{ fontSize: 12, color: 'rgba(240,244,255,0.3)', textDecoration: 'none' }}>Privacidade</Link>
            <Link href="/excluir-conta" style={{ fontSize: 12, color: 'rgba(240,244,255,0.3)', textDecoration: 'none' }}>Excluir conta</Link>
            <Link href="/planos" style={{ fontSize: 12, color: 'rgba(240,244,255,0.3)', textDecoration: 'none' }}>Planos</Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.2)', margin: 0 }}>© 2026 GestãoFC</p>
        </div>
      </footer>

    </div>
  )
}
