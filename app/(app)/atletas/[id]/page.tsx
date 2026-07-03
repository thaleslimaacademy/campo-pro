import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { podeFinanceiro } from '@/lib/auth'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import CopiarLink from './CopiarLink'
import GraficoPresenca from './GraficoPresenca'
import FotoAtleta from './FotoAtleta'
import GerarCobranca from './GerarCobranca'
import CobrancaAcoes from './CobrancaAcoes'
import BottomNav from '@/components/ui/BottomNav'

const T = {
  bg:      '#0A0E1A',
  surface: '#0D1220',
  surface2:'#121A2E',
  primary: '#4169E1',
  accent:  '#00BFFF',
  sky:     '#7DD3FC',
  text:    '#F0F4FF',
  muted:   'rgba(240,244,255,0.4)',
  border:  'rgba(240,244,255,0.07)',
  green:   '#00D67A',
  red:     '#FF4444',
  gold:    '#FFD700',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const CARD: React.CSSProperties = { background: T.surface, borderRadius: 14, padding: 16, border: `1px solid ${T.border}`, marginBottom: 10 }
const LABEL: React.CSSProperties = { fontFamily: SYNE, fontWeight: 700, fontSize: 11, color: T.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }
const ROW: React.CSSProperties  = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${T.border}` }

export default async function PerfilAtleta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const escolaId = await getEscolaIdServer()

  const [atletaRes, financeiroOk] = await Promise.all([
    supabaseAdmin.from('Atleta').select('*').eq('id', id).eq('escolaId', escolaId).single(),
    podeFinanceiro(),
  ])
  const atleta = atletaRes.data
  if (!atleta) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: T.muted, fontFamily: INTER }}>Atleta não encontrado.</p>
    </div>
  )

  // Busca paralela de todos os dados
  const agora = new Date()
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)

  const [responsaveisRes, presencasRes, cobrancasRes, turmaRes] = await Promise.all([
    supabaseAdmin.from('Responsavel').select('*').eq('atletaId', id),
    supabaseAdmin.from('Presenca').select('status, criadoEm').eq('atletaId', id).gte('criadoEm', seisAtras.toISOString()).order('criadoEm', { ascending: true }),
    financeiroOk ? supabaseAdmin.from('Cobranca').select('id, valor, vencimento, status, descricao').eq('atletaId', id).order('vencimento', { ascending: false }).limit(12) : Promise.resolve({ data: null }),
    atleta.turmaId ? supabaseAdmin.from('Turma').select('id, nome').eq('id', atleta.turmaId).single() : Promise.resolve({ data: null }),
  ])

  const responsaveis = responsaveisRes.data || []
  const presencas    = presencasRes.data || []
  const cobrancas    = cobrancasRes.data || []
  const turma        = turmaRes.data

  // Presença por mês
  const meses: Record<string, { presentes: number; total: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses[d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })] = { presentes: 0, total: 0 }
  }
  presencas.forEach((p: { status: string; criadoEm: string }) => {
    const chave = new Date(p.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (meses[chave]) { meses[chave].total++; if (p.status === 'PRESENTE') meses[chave].presentes++ }
  })
  const dadosGrafico = Object.entries(meses).map(([mes, d]) => ({ mes, presentes: d.presentes, total: d.total, percentual: d.total > 0 ? Math.round((d.presentes / d.total) * 100) : 0 }))
  const totalPresentes = presencas.filter((p: { status: string }) => p.status === 'PRESENTE').length
  const pct = presencas.length > 0 ? Math.round((totalPresentes / presencas.length) * 100) : 0

  // Financeiro
  const totalPago     = cobrancas.filter((c: { status: string }) => c.status === 'PAGO').reduce((s: number, c: { valor: number }) => s + Number(c.valor), 0)
  const totalPendente = cobrancas.filter((c: { status: string }) => c.status === 'PENDENTE').reduce((s: number, c: { valor: number }) => s + Number(c.valor), 0)
  const totalVencido  = cobrancas.filter((c: { status: string }) => c.status === 'VENCIDO').reduce((s: number, c: { valor: number }) => s + Number(c.valor), 0)

  const nascimento = atleta.dataNascimento
    ? new Date(atleta.dataNascimento.includes('T') ? atleta.dataNascimento : atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
    : null

  const STATUS_COR: Record<string, string> = { PAGO: T.green, PENDENTE: T.gold, VENCIDO: T.red, CANCELADO: T.muted }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/atletas" style={{ color: 'rgba(240,244,255,0.7)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true"></i>
            </a>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>Elenco</div>
              <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 20, color: T.text, letterSpacing: -0.5, textTransform: 'uppercase' }}>Perfil do Atleta</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/atletas/${atleta.id}/carteirinha`} style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: T.text, borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontSize: 15 }}>🪪</a>
            <a href={`/atletas/${atleta.id}/avaliacao`}   style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: T.text, borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontSize: 15 }}>📋</a>
            <a href={`/atletas/${atleta.id}/editar`}      style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: T.text, borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontSize: 15 }}>✏️</a>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* CARD IDENTIDADE */}
        <div style={CARD}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
            <FotoAtleta atletaId={atleta.id} fotoUrl={atleta.fotoUrl || null} nome={atleta.nome} />
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 18, color: T.text, margin: '0 0 4px', letterSpacing: -0.3 }}>{atleta.nome}</p>
              <p style={{ color: T.primary, fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{atleta.posicao || 'Sem posição'}</p>
              {turma && (
                <span style={{ display: 'inline-block', background: `${T.gold}18`, border: `1px solid ${T.gold}40`, color: T.gold, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{turma.nome}</span>
              )}
              {atleta.bolsista && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: turma ? 6 : 0, background: `${T.green}12`, border: `1px solid ${T.green}30`, color: T.green, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                  🎓 Bolsista
                </span>
              )}
            </div>
          </div>

          {[
            nascimento && ['Nascimento', nascimento],
            atleta.cpf && ['CPF', atleta.cpf],
            atleta.rg && ['RG', atleta.rg],
            atleta.telefone && ['Telefone', atleta.telefone],
          ].filter(Boolean).map((row) => (
            <div key={row![0] as string} style={{ ...ROW }}>
              <span style={{ fontSize: 12, color: T.muted }}>{row![0]}</span>
              <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{row![1]}</span>
            </div>
          ))}
        </div>

        {/* GERAR COBRANÇA (só pra não-bolsistas e quem pode financeiro) */}
        {!atleta.bolsista && financeiroOk && <GerarCobranca atletaId={atleta.id} atletaNome={atleta.nome} escolaId={escolaId} />}

        {/* BOLSISTA BANNER */}
        {atleta.bolsista && (
          <div style={{ background: `${T.green}08`, border: `1px solid ${T.green}25`, borderRadius: 14, padding: 14, marginBottom: 10, textAlign: 'center' }}>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.green, marginBottom: 4 }}>🎓 Aluno Bolsista</p>
            <p style={{ color: T.muted, fontSize: 12 }}>Mensalidade 100% gratuita — nenhuma cobrança gerada.</p>
            {atleta.motivoBolsa && <p style={{ color: `${T.green}90`, fontSize: 11, marginTop: 4 }}>Motivo: {atleta.motivoBolsa}</p>}
          </div>
        )}

        {/* HISTÓRICO FINANCEIRO */}
        {financeiroOk && !atleta.bolsista && (
          <div style={CARD}>
            <p style={LABEL}>Histórico Financeiro</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Pago',     valor: totalPago,     color: T.green },
                { label: 'Pendente', valor: totalPendente, color: T.gold  },
                { label: 'Vencido',  valor: totalVencido,  color: T.red   },
              ].map(s => (
                <div key={s.label} style={{ background: s.color + '10', border: `1px solid ${s.color}20`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ color: s.color, fontFamily: SYNE, fontWeight: 800, fontSize: 13, margin: '0 0 3px' }}>R$ {s.valor.toFixed(0)}</p>
                  <p style={{ color: T.muted, fontSize: 10, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
            {cobrancas.length === 0 ? (
              <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhuma cobrança registrada</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(cobrancas as { id: string; descricao: string | null; vencimento: string; valor: number; status: string }[]).map(c => (
                  <div key={c.id} style={{ background: T.surface2, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: '0 0 2px' }}>{c.descricao || 'Mensalidade'}</p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{new Date(c.vencimento.includes('T') ? c.vencimento : c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>R$ {Number(c.valor).toFixed(2)}</p>
                        <p style={{ fontSize: 10, fontWeight: 800, color: STATUS_COR[c.status] || T.muted, margin: 0 }}>{c.status}</p>
                      </div>
                    </div>
                    <CobrancaAcoes cobrancaId={c.id} status={c.status} atletaId={atleta.id} escolaId={escolaId} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTÓRICO DE PRESENÇA */}
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ ...LABEL, marginBottom: 0 }}>Histórico de Presença</p>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 18, color: pct >= 75 ? T.green : pct >= 50 ? T.gold : T.red, margin: 0, lineHeight: 1 }}>{pct}%</p>
              <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>{totalPresentes}/{presencas.length} treinos</p>
            </div>
          </div>
          {presencas.length === 0 ? (
            <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhuma presença registrada</p>
          ) : (
            <GraficoPresenca dados={dadosGrafico} />
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            {[{ color: T.green, label: 'Presente' }, { color: T.border, label: 'Total' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }}></div>
                <span style={{ fontSize: 11, color: T.muted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ENDEREÇO */}
        {atleta.endereco && (
          <div style={CARD}>
            <p style={LABEL}>Endereço</p>
            <p style={{ fontSize: 13, color: T.text, margin: '0 0 4px' }}>{atleta.endereco}, {atleta.numero}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: '0 0 2px' }}>{atleta.bairro} — {atleta.cidade}/{atleta.estado}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>CEP: {atleta.cep}</p>
          </div>
        )}

        {/* RESPONSÁVEL */}
        {responsaveis.length > 0 && (
          <div style={CARD}>
            <p style={LABEL}>Responsável</p>
            {(responsaveis as { id: string; nome: string; whatsapp: string | null; telefone: string | null }[]).map(r => (
              <div key={r.id} style={{ ...ROW, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: T.text, margin: '0 0 2px' }}>{r.nome}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{r.whatsapp || r.telefone}</p>
                </div>
                {(r.whatsapp || r.telefone) && (
                  <a href={`https://wa.me/55${(r.whatsapp || r.telefone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    style={{ background: `${T.green}15`, border: `1px solid ${T.green}30`, color: T.green, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* LINKS */}
        <div style={CARD}>
          <p style={LABEL}>Link Área dos Pais</p>
          <p style={{ fontSize: 11, color: T.muted, wordBreak: 'break-all', marginBottom: 10 }}>{'https://gestaofc.com.br/pais/' + atleta.tokenPais}</p>
          <CopiarLink link={'https://gestaofc.com.br/pais/' + atleta.tokenPais} />
        </div>

        <div style={{ background: `${T.gold}08`, border: `1px solid ${T.gold}25`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 11, color: T.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Link de Rematrícula</p>
          <p style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Envie para o responsável renovar a matrícula.</p>
          <p style={{ fontSize: 11, color: T.muted, wordBreak: 'break-all', marginBottom: 10 }}>{'https://gestaofc.com.br/rematricula/' + atleta.id}</p>
          <CopiarLink link={'https://gestaofc.com.br/rematricula/' + atleta.id} />
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
