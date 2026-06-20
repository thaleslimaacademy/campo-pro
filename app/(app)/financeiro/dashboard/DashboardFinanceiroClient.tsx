'use client'

import { useRouter } from 'next/navigation'
import type { DashboardFinanceiroData } from './actions'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function MiniBar({ recebido, previsto }: { recebido: number; previsto: number }) {
  const pct = previsto > 0 ? Math.min((recebido / previsto) * 100, 100) : 0
  return (
    <div style={{ width: '100%', height: 4, background: 'rgba(65,105,225,0.2)', borderRadius: 2, marginTop: 6 }}>
      <div style={{ width: pct + '%', height: 4, background: '#00BFFF', borderRadius: 2, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function GraficoBarras({ dados }: { dados: DashboardFinanceiroData['grafico12Meses'] }) {
  const maxVal = Math.max(...dados.map(d => Math.max(d.previsto, d.recebido)), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
      {dados.map((d) => {
        const hPrev = Math.max((d.previsto / maxVal) * 100, 2)
        const hRec = Math.max((d.recebido / maxVal) * 100, 2)
        return (
          <div key={d.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: 100 }}>
              <div
                title={'Previsto: ' + fmt(d.previsto)}
                style={{ flex: 1, height: hPrev + '%', background: 'rgba(65,105,225,0.35)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s' }}
              />
              <div
                title={'Recebido: ' + fmt(d.recebido)}
                style={{ flex: 1, height: hRec + '%', background: '#00BFFF', borderRadius: '3px 3px 0 0', transition: 'height 0.4s' }}
              />
            </div>
            <span style={{ fontSize: 9, color: '#7DD3FC', whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardFinanceiroClient({ data }: { data: DashboardFinanceiroData }) {
  const router = useRouter()
  const { resumo, grafico12Meses, topDevedores, patrocinadores } = data

  const cards = [
    { label: 'Previsto',       valor: fmt(resumo.previsto),                          sub: 'mes atual',                                    cor: '#7DD3FC',  icon: 'ti-calendar-dollar', bar: false },
    { label: 'Recebido',       valor: fmt(resumo.recebido),                          sub: 'mes atual',                                    cor: '#00BFFF',  icon: 'ti-circle-check',    bar: true  },
    { label: 'Em Aberto',      valor: fmt(resumo.emAberto),                          sub: 'pendente',                                     cor: '#F0F4FF',  icon: 'ti-clock',           bar: false },
    { label: 'Inadimplencia',  valor: resumo.inadimplencia.toFixed(1) + '%',         sub: fmt(resumo.vencido) + ' vencido',               cor: resumo.inadimplencia > 20 ? '#FF6B6B' : resumo.inadimplencia > 10 ? '#FFB347' : '#4ADE80', icon: 'ti-alert-triangle', bar: false },
    { label: 'Ticket Medio',   valor: fmt(resumo.ticketMedio),                       sub: resumo.totalAtivosComCobranca + ' pagantes',    cor: '#7DD3FC',  icon: 'ti-user-dollar',     bar: false },
    { label: 'Patrocinadores', valor: String(patrocinadores),                        sub: 'ativos',                                       cor: '#00BFFF',  icon: 'ti-award',           bar: false },
  ]

  const atalhos = [
    { label: 'Mensalidades', icon: 'ti-calendar-repeat', href: '/financeiro/mensalidades' },
    { label: 'Boletos',      icon: 'ti-file-invoice',    href: '/financeiro/boleto'       },
    { label: 'Patrocinios',  icon: 'ti-trophy',          href: '/patrocinadores'          },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', paddingBottom: 88, fontFamily: 'Inter, sans-serif' }}>

      <div style={{ background: 'linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)', padding: '16px 16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F0F4FF' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
        </button>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#F0F4FF', textTransform: 'uppercase', letterSpacing: 1 }}>
            Financeiro
          </div>
          <div style={{ fontSize: 12, color: '#7DD3FC' }}>Dashboard inteligente</div>
        </div>
        <button
          onClick={() => router.push('/financeiro/boleto')}
          style={{ marginLeft: 'auto', background: 'rgba(0,191,255,0.2)', border: '1px solid #00BFFF', borderRadius: 8, padding: '6px 12px', color: '#00BFFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i className="ti ti-file-invoice" style={{ fontSize: 14 }} />
          Boleto
        </button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.25)', borderRadius: 12, padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <i className={'ti ' + c.icon} style={{ fontSize: 16, color: c.cor }} />
                <span style={{ fontSize: 11, color: '#7DD3FC', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.cor, fontFamily: 'Syne, sans-serif' }}>{c.valor}</div>
              <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)', marginTop: 2 }}>{c.sub}</div>
              {c.bar && <MiniBar recebido={resumo.recebido} previsto={resumo.previsto} />}
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.25)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#F0F4FF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Receita 12 Meses</div>
              <div style={{ fontSize: 11, color: '#7DD3FC', marginTop: 2 }}>previsto vs recebido</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(65,105,225,0.35)' }} />
                <span style={{ fontSize: 10, color: '#7DD3FC' }}>Previsto</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#00BFFF' }} />
                <span style={{ fontSize: 10, color: '#7DD3FC' }}>Recebido</span>
              </div>
            </div>
          </div>
          <GraficoBarras dados={grafico12Meses} />
        </div>

        {topDevedores.length > 0 && (
          <div style={{ background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.25)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#F0F4FF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Devedores</div>
                <div style={{ fontSize: 11, color: '#7DD3FC', marginTop: 2 }}>cobrancas vencidas</div>
              </div>
              <button
                onClick={() => router.push('/financeiro/mensalidades?status=VENCIDO')}
                style={{ background: 'none', border: '1px solid rgba(65,105,225,0.4)', borderRadius: 8, padding: '4px 10px', color: '#7DD3FC', fontSize: 11, cursor: 'pointer' }}
              >
                Ver todos
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topDevedores.map((d, i) => (
                <div key={d.atletaId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(10,14,26,0.5)', borderRadius: 10, border: '1px solid rgba(65,105,225,0.15)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'rgba(255,107,107,0.2)' : 'rgba(65,105,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#FF6B6B' : '#7DD3FC', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#F0F4FF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nome}</div>
                    <div style={{ fontSize: 11, color: '#7DD3FC' }}>{d.qtdCobrancas} cobranca{d.qtdCobrancas > 1 ? 's' : ''} vencida{d.qtdCobrancas > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B6B' }}>{fmt(d.totalVencido)}</div>
                    <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.4)' }}>
                      desde {new Date(d.vencimentoMaisAntigo).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {atalhos.map(a => (
            <button
              key={a.label}
              onClick={() => router.push(a.href)}
              style={{ background: 'rgba(65,105,225,0.1)', border: '1px solid rgba(65,105,225,0.3)', borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <i className={'ti ' + a.icon} style={{ fontSize: 20, color: '#4169E1' }} />
              <span style={{ fontSize: 11, color: '#7DD3FC', textAlign: 'center' }}>{a.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
