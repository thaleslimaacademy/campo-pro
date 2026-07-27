import { supabase } from '@/lib/supabase'
import PushNotificationButton from '@/components/PushNotificationButton'
import AtivarDebitoAutomatico from './AtivarDebitoAutomatico'

const T = {
  bg: '#060B05',
  surface: 'rgba(244,251,239,0.025)',
  turf: '#3ED54A',
  gold: '#D4AF37',
  chalk: '#F4FBEF',
  muted: 'rgba(244,251,239,0.45)',
  alert: '#FF5252',
}
const SYNE = 'Syne, sans-serif'
const MONO = "'Space Mono', monospace"
const INTER = 'Inter, sans-serif'

export default async function AreaPais({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: atleta } = await supabase
    .from('Atleta')
    .select('id, nome, posicao, tokenPais, fotoUrl, escolaId, valorMensalidade, asaasSubscriptionId')
    .eq('tokenPais', token)
    .single()

  if (!atleta) {
    return (
      <div style={{ background: T.bg, fontFamily: INTER }} className="min-h-screen text-white flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-4">❌</div>
          <h2 className="text-xl font-black" style={{ fontFamily: SYNE }}>Link inválido</h2>
          <p className="text-gray-400 mt-2 text-sm">Este link não existe ou expirou.</p>
        </div>
      </div>
    )
  }

  const mesAtual = new Date().toISOString().slice(0, 7)
  const { data: presencas } = await supabase
    .from('Presenca').select('status').eq('atletaId', atleta.id).gte('criadoEm', mesAtual + '-01')

  const total = presencas?.length || 0
  const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
  const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0

  const { data: cobrancas } = await supabase
    .from('Cobranca').select('id, valor, vencimento, status, descricao, pixCopiaCola')
    .eq('atletaId', atleta.id).order('vencimento', { ascending: false }).limit(6)

  const { data: premiacoes } = await supabase
    .from('Premiacao').select('id, titulo, icone').eq('atletaId', atleta.id).order('dataConquista', { ascending: false })

  const { data: avaliacoes } = await supabase
    .from('Avaliacao').select('dataAvaliacao, peso, altura, imc, percentualGordura')
    .eq('atletaId', atleta.id).order('dataAvaliacao', { ascending: false }).limit(1)
  const ultimaAval = avaliacoes?.[0] || null

  const { data: escola } = await supabase.from('Escola').select('slug, nome').eq('id', atleta.escolaId).single()
  const escolaSlug = escola?.slug || ''
  const escolaNome = escola?.nome?.split('—').pop()?.trim() || escola?.nome || 'Academia'

  const totalConquistas = premiacoes?.length || 0
  const nivel = totalConquistas >= 61 ? { label: 'Lenda', emoji: '👑' }
    : totalConquistas >= 51 ? { label: 'Referência', emoji: '🟡' }
    : totalConquistas >= 41 ? { label: 'Elite', emoji: '🔴' }
    : totalConquistas >= 31 ? { label: 'Destaque', emoji: '🟠' }
    : totalConquistas >= 21 ? { label: 'Competidor', emoji: '🟣' }
    : totalConquistas >= 11 ? { label: 'Em Desenvolvimento', emoji: '🔵' }
    : totalConquistas >= 6 ? { label: 'Aprendiz', emoji: '🟢' }
    : { label: 'Iniciante', emoji: '🔰' }

  const totalPago = cobrancas?.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0) || 0
  const totalPendente = cobrancas?.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDO').reduce((s, c) => s + Number(c.valor), 0) || 0
  const temInadimplencia = cobrancas?.some(c => c.status === 'VENCIDO') || false

  const statusCor: Record<string, string> = { PAGO: T.turf, PENDENTE: T.gold, VENCIDO: T.alert, CANCELADO: '#6B7280' }
  const statusBorder: Record<string, string> = {
    PAGO: 'rgba(62,213,74,0.25)', PENDENTE: 'rgba(212,175,55,0.3)', VENCIDO: 'rgba(255,82,82,0.3)', CANCELADO: 'rgba(107,114,128,0.15)',
  }
  const statusBg: Record<string, string> = {
    PAGO: 'rgba(62,213,74,0.05)', PENDENTE: 'rgba(212,175,55,0.05)', VENCIDO: 'rgba(255,82,82,0.06)', CANCELADO: 'rgba(107,114,128,0.05)',
  }

  const barColor = percentual >= 75 ? T.turf : percentual >= 50 ? T.gold : T.alert
  const barLabel = percentual >= 75 ? 'Frequência em dia' : percentual === 0 ? 'Nenhum treino registrado este mês' : 'Frequência abaixo do ideal'

  const CARD: React.CSSProperties = { background: T.surface, border: '1px solid rgba(244,251,239,0.08)', borderRadius: 18, padding: 18 }
  const EYEBROW: React.CSSProperties = { fontFamily: SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gold, marginBottom: 14 }

  return (
    <div style={{ background: `linear-gradient(180deg, ${T.bg} 0%, #050705 45%, #030402 100%)`, fontFamily: INTER }} className="min-h-screen text-white pb-14">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" />

      {/* ── HERO / CARTÃO DE ESCALAÇÃO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '38px 20px 26px', borderBottom: '1px solid rgba(244,251,239,0.06)' }}>
        {/* marcação de campo, decorativa, baixa opacidade */}
        <svg viewBox="0 0 400 220" style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 460, opacity: 0.1, pointerEvents: 'none' }}>
          <line x1="200" y1="0" x2="200" y2="220" stroke={T.turf} strokeWidth="1.5" />
          <circle cx="200" cy="110" r="46" fill="none" stroke={T.turf} strokeWidth="1.5" />
          <circle cx="200" cy="110" r="2.5" fill={T.turf} />
        </svg>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 22 }}>
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.25em', color: T.muted, textTransform: 'uppercase', marginBottom: 6 }}>Área do Responsável</p>
          <h1 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em', color: T.gold, textTransform: 'uppercase', lineHeight: 1.15 }}>{escolaNome}</h1>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {atleta.fotoUrl ? (
            <img src={atleta.fotoUrl} alt={atleta.nome} style={{ width: 96, height: 96, borderRadius: 20, objectFit: 'cover', border: `2px solid ${T.turf}55`, boxShadow: `0 0 30px ${T.turf}22` }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: 20, background: `${T.turf}12`, border: `2px solid ${T.turf}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, fontSize: 34, color: T.turf }}>
              {atleta.nome[0]}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 24, letterSpacing: '-0.01em', color: T.chalk, lineHeight: 1.1 }}>{atleta.nome}</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${T.gold}14`, border: `1px solid ${T.gold}40`, color: T.gold }}>{atleta.posicao || 'Sem posição'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${T.turf}10`, border: `1px solid ${T.turf}35`, color: T.turf }}>{nivel.emoji} {nivel.label}</span>
            </div>
          </div>
        </div>

        {/* faixa estilo placar */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: 28, marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(244,251,239,0.06)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: barColor }}>{percentual}%</p>
            <p style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Presença</p>
          </div>
          <div style={{ width: 1, background: 'rgba(244,251,239,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: T.gold }}>{totalConquistas}</p>
            <p style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Conquistas</p>
          </div>
          <div style={{ width: 1, background: 'rgba(244,251,239,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: temInadimplencia ? T.alert : T.chalk }}>{'R$' + totalPendente.toFixed(0)}</p>
            <p style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>A pagar</p>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div className="px-5 mt-5 space-y-4">

        {/* ── PRESENÇA ── */}
        <div style={CARD}>
          <p style={EYEBROW}>Presença este mês</p>
          <div className="flex items-end gap-4 mb-3">
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 44, lineHeight: 1, color: barColor }}>{percentual}%</span>
            <div className="pb-1">
              <p className="text-sm font-semibold text-white">{presentes} de {total} treinos</p>
              <p className="text-xs mt-0.5" style={{ color: barColor + 'CC' }}>{barLabel}</p>
            </div>
          </div>
          {total > 0 && (
            <div style={{ width: '100%', borderRadius: 999, height: 6, background: 'rgba(244,251,239,0.07)' }}>
              <div style={{ width: percentual + '%', height: 6, borderRadius: 999, background: barColor, boxShadow: `0 0 10px ${barColor}70`, transition: 'width 0.7s' }} />
            </div>
          )}
        </div>

        {/* ── FINANCEIRO ── */}
        <div style={CARD}>
          <p style={EYEBROW}>Financeiro</p>

          {temInadimplencia && (
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,82,82,0.07)', border: `1px solid ${T.alert}40` }}>
              <p style={{ color: T.alert, fontWeight: 700, fontSize: 13 }}>Pagamento em atraso</p>
              <p className="text-xs mt-1" style={{ color: T.muted }}>Fale com a escola para regularizar.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: `${T.turf}08`, border: `1px solid ${T.turf}25` }}>
              <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: T.turf }}>{'R$ ' + totalPago.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: T.muted }}>Total pago</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: totalPendente > 0 ? `${T.gold}0A` : 'rgba(244,251,239,0.03)', border: totalPendente > 0 ? `1px solid ${T.gold}35` : '1px solid rgba(244,251,239,0.07)' }}>
              <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: totalPendente > 0 ? T.gold : '#4B5563' }}>{'R$ ' + totalPendente.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: T.muted }}>A pagar</p>
            </div>
          </div>

          {!cobrancas || cobrancas.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: T.muted }}>Nenhuma cobrança até agora.</p>
          ) : (
            <div className="space-y-2">
              {cobrancas.map(c => (
                <div key={c.id} className="rounded-xl p-3" style={{ background: statusBg[c.status] || 'rgba(244,251,239,0.03)', border: `1px solid ${statusBorder[c.status] || 'rgba(244,251,239,0.07)'}` }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-sm font-semibold">{c.descricao || 'Mensalidade'}</p>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full ml-2 flex-shrink-0" style={{ color: statusCor[c.status] || '#9CA3AF', background: (statusCor[c.status] || '#9CA3AF') + '18' }}>{c.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.muted }}>{'Vence ' + new Date((c.vencimento || '').slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: T.chalk }}>{'R$ ' + Number(c.valor).toFixed(2)}</p>
                  </div>
                  {(c.status === 'PENDENTE' || c.status === 'VENCIDO') && c.pixCopiaCola && (
                    <div className="mt-2.5 rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${T.turf}20` }}>
                      <p className="text-xs mb-1" style={{ color: T.muted }}>Pix Copia e Cola</p>
                      <p className="text-xs break-all" style={{ fontFamily: MONO, color: T.turf, lineHeight: 1.6 }}>{c.pixCopiaCola}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CONQUISTAS ── */}
        {premiacoes && premiacoes.length > 0 && (
          <div style={CARD}>
            <p style={EYEBROW}>Conquistas</p>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 30 }}>{nivel.emoji}</span>
              <div>
                <p style={{ fontFamily: SYNE, fontWeight: 900, color: T.chalk }}>{nivel.label}</p>
                <p style={{ fontFamily: MONO, fontSize: 11, color: T.gold }}>{totalConquistas} desbloqueadas</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {premiacoes.slice(0, 8).map((p: { id: string; titulo: string; icone: string }) => (
                <span key={p.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}30`, color: T.gold }}>
                  {p.icone} {p.titulo}
                </span>
              ))}
              {premiacoes.length > 8 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(244,251,239,0.05)', color: T.muted }}>+{premiacoes.length - 8} mais</span>
              )}
            </div>
          </div>
        )}

        {/* ── AVALIAÇÃO FÍSICA ── */}
        {ultimaAval && (
          <div style={CARD}>
            <p style={EYEBROW}>Última avaliação física</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: T.muted, marginBottom: 12 }}>{new Date(ultimaAval.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Peso', valor: ultimaAval.peso ? ultimaAval.peso + ' kg' : '—' },
                { label: 'Altura', valor: ultimaAval.altura ? ultimaAval.altura + ' cm' : '—' },
                { label: 'IMC', valor: ultimaAval.imc ? Number(ultimaAval.imc).toFixed(1) : '—' },
                { label: '% Gordura', valor: (ultimaAval as any).percentualGordura ? Number((ultimaAval as any).percentualGordura).toFixed(1) + '%' : '—' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: `${T.turf}08`, border: `1px solid ${T.turf}20` }}>
                  <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: T.chalk }}>{item.valor}</p>
                  <p className="text-xs mt-1" style={{ color: T.muted }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOTOS E LOJA ── */}
        {escolaSlug && (
          <div style={CARD}>
            <p style={EYEBROW}>Academia</p>
            <div className="grid grid-cols-2 gap-3">
              <a href={`/galeria/${escolaSlug}`} className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-black text-sm" style={{ background: `${T.gold}0F`, border: `1px solid ${T.gold}30`, color: T.gold, textDecoration: 'none', fontFamily: SYNE }}>📸 Fotos</a>
              <a href={`/loja/${escolaSlug}`} className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-black text-sm" style={{ background: `${T.turf}0F`, border: `1px solid ${T.turf}30`, color: T.turf, textDecoration: 'none', fontFamily: SYNE }}>🛒 Loja</a>
            </div>
          </div>
        )}

        {/* ── DÉBITO AUTOMÁTICO ── */}
        <AtivarDebitoAutomatico token={token} valorMensalidade={atleta.valorMensalidade ? Number(atleta.valorMensalidade) : null} jaAtivo={!!atleta.asaasSubscriptionId} />

        {/* ── PUSH NOTIFICATIONS ── */}
        <PushNotificationButton atletaId={atleta.id} escolaId={atleta.escolaId || ''} />

        {/* ── CONTATO ── */}
        <div style={CARD}>
          <p style={EYEBROW}>Fale conosco</p>
          <a href="https://wa.me/5534998168467" target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${T.turf} 0%, #2bb83c 100%)`, color: '#050705', fontFamily: SYNE, boxShadow: `0 0 24px ${T.turf}30, 0 4px 12px rgba(0,0,0,0.4)`, letterSpacing: '0.02em' }}>
            💬 Falar com a academia
          </a>
        </div>

      </div>
    </div>
  )
}
