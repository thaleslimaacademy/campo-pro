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
import Condutas from './Condutas'
import Conquistas from './Conquistas'

const T = {
  bg:      '#F6F8F7',
  surface: '#FFFFFF',
  surface2:'#F3F5F4',
  primary: '#2EA866',
  accent:  '#23874F',
  sky:     '#6B7280',
  text:    '#1F2937',
  muted:   '#6B7280',
  border:  'rgba(16,24,40,0.1)',
  green:   '#16A34A',
  red:     '#DC2626',
  gold:    '#B7791F',
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

  // Irmãos: só mostra se a família já foi CONFIRMADA (vínculo pendente de
  // revisão em /familias não aparece aqui — ainda pode não ser a mesma família).
  let irmaos: { id: string; nome: string }[] = []
  if (atleta.familiaId) {
    const { data: familia } = await supabaseAdmin.from('Familia').select('status').eq('id', atleta.familiaId).single()
    if (familia?.status === 'CONFIRMADA') {
      const { data } = await supabaseAdmin.from('Atleta')
        .select('id, nome')
        .eq('familiaId', atleta.familiaId)
        .eq('ativo', true)
        .neq('id', atleta.id)
        .order('nome')
      irmaos = data ?? []
    }
  }

  // Busca paralela de todos os dados
  const agora = new Date()
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)

  const [responsaveisRes, presencasRes, cobrancasRes, turmaRes, condutasRes, premiosRes] = await Promise.all([
    supabaseAdmin.from('Responsavel').select('*').eq('atletaId', id),
    supabaseAdmin.from('Presenca').select('status, criadoEm').eq('atletaId', id).gte('criadoEm', seisAtras.toISOString()).order('criadoEm', { ascending: true }),
    financeiroOk ? supabaseAdmin.from('Cobranca').select('id, valor, valorPago, vencimento, competencia, status, descricao, familiaCobrancaId, reciboToken').eq('atletaId', id).is('excluidaEm', null).order('vencimento', { ascending: false }).limit(24) : Promise.resolve({ data: null }),
    atleta.turmaId ? supabaseAdmin.from('Turma').select('id, nome').eq('id', atleta.turmaId).single() : Promise.resolve({ data: null }),
    supabaseAdmin.from('AtletaConduta').select('id, texto, tipo, criadoEm').eq('atletaId', id).eq('escolaId', escolaId).order('criadoEm', { ascending: false }).limit(50),
    supabaseAdmin.from('Premiacao').select('id, titulo, icone, descricao, dataConquista').eq('atletaId', id).eq('escolaId', escolaId).order('dataConquista', { ascending: false }),
  ])

  const responsaveis = responsaveisRes.data || []
  const presencas    = presencasRes.data || []
  const cobrancas    = (cobrancasRes.data || []) as { id: string; descricao: string | null; vencimento: string; competencia: string | null; valor: number; valorPago: number | null; status: string; familiaCobrancaId: string | null; reciboToken: string | null }[]
  const condutas     = (condutasRes.data || []) as { id: string; texto: string; tipo: string; criadoEm: string }[]
  const premios      = (premiosRes.data || []) as { id: string; titulo: string; icone: string | null; descricao: string | null; dataConquista: string | null }[]
  const turma        = turmaRes.data

  // Cobranças de filho de família (familiaCobrancaId preenchido) mostram o
  // valor real da agregada (soma dos irmãos), não o valor da ficha individual.
  const idsAgregadas = Array.from(new Set(cobrancas.map((c) => c.familiaCobrancaId).filter((v): v is string => !!v)))
  const agregadasPorId = new Map<string, { valor: number; vencimento: string; status: string }>()
  if (idsAgregadas.length > 0) {
    const { data: agregadas } = await supabaseAdmin.from('Cobranca').select('id, valor, vencimento, status').in('id', idsAgregadas)
    for (const a of (agregadas ?? []) as { id: string; valor: number; vencimento: string; status: string }[]) agregadasPorId.set(a.id, a)
  }

  // Totais do card: uma cobrança de filho de família (familiaCobrancaId
  // preenchido) já está representada pelo valor da agregada — não soma a
  // ficha individual dela de novo. A chave dedupe pela id da agregada, então
  // mesmo se o atleta atual for o "dono técnico" (a própria linha FAMILIA
  // aparece na lista dele, junto com a ficha individual dele mesmo), ela só
  // entra uma vez.
  const totaisPorChave = new Map<string, { valor: number; status: string }>()
  for (const c of cobrancas) {
    if (c.familiaCobrancaId) {
      const agregada = agregadasPorId.get(c.familiaCobrancaId)
      if (agregada) totaisPorChave.set(c.familiaCobrancaId, { valor: agregada.valor, status: agregada.status })
      continue
    }
    totaisPorChave.set(c.id, { valor: c.valor, status: c.status })
  }
  const valoresParaTotais = Array.from(totaisPorChave.values())

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
  const totalPago     = valoresParaTotais.filter((v) => v.status === 'PAGO').reduce((s, v) => s + Number(v.valor), 0)
  const totalPendente = valoresParaTotais.filter((v) => v.status === 'PENDENTE').reduce((s, v) => s + Number(v.valor), 0)
  const totalVencido  = valoresParaTotais.filter((v) => v.status === 'VENCIDO').reduce((s, v) => s + Number(v.valor), 0)

  const qtdPendente = valoresParaTotais.filter((v) => v.status === 'PENDENTE').length
  const qtdVencido  = valoresParaTotais.filter((v) => v.status === 'VENCIDO').length
  const emDia = qtdVencido === 0
  const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesRef = (c: { competencia: string | null; vencimento: string }) => {
    const [a, m] = String(c.competencia || c.vencimento).slice(0, 7).split('-').map(Number)
    return a && m ? `${MESES_PT[m - 1]} de ${a}` : 'Mensalidade'
  }
  const pagas = cobrancas.filter(c => c.status === 'PAGO').slice(0, 3)

  const idade = (() => {
    if (!atleta.dataNascimento) return null
    const n = new Date(String(atleta.dataNascimento).slice(0, 10) + 'T12:00:00')
    const h = new Date()
    let i = h.getFullYear() - n.getFullYear()
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--
    return i >= 0 && i < 100 ? i : null
  })()
  const respPrincipal = ((responsaveisRes.data || []) as { nome: string; principal?: boolean }[]).sort((a, b) => Number(!!b.principal) - Number(!!a.principal))[0]?.nome || null

  const nascimento = atleta.dataNascimento
    ? new Date(atleta.dataNascimento.includes('T') ? atleta.dataNascimento : atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
    : null

  const STATUS_COR: Record<string, string> = { PAGO: T.green, PENDENTE: T.gold, VENCIDO: T.red, CANCELADO: T.muted }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: '#4169E1', padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/atletas" style={{ color: 'rgba(240,244,255,0.7)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true"></i>
            </a>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>Elenco</div>
              <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: -0.5, textTransform: 'uppercase' }}>Perfil do Atleta</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/atletas/${atleta.id}/carteirinha`} style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontSize: 15 }}>🪪</a>
            <a href={`/atletas/${atleta.id}/avaliacao`}   style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontSize: 15 }}>📋</a>
            <a href={`/atletas/${atleta.id}/editar`}      style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', fontSize: 15 }}>✏️</a>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* CARD IDENTIDADE (modelo novo) */}
        <div style={{ ...CARD, borderRadius: 18, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <FotoAtleta atletaId={atleta.id} fotoUrl={atleta.fotoUrl || null} nome={atleta.nome} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Nome</p>
              <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 18, color: T.text, margin: '0 0 8px', letterSpacing: -0.3, lineHeight: 1.15 }}>{atleta.nome}</p>
              {[
                ['Idade', idade != null ? `${idade} anos` : null],
                ['Turma', turma?.nome || null],
                ['Posição', atleta.posicao || null],
                ['Responsável', respPrincipal],
              ].filter(r => r[1]).map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: 8, fontSize: 12.5, margin: '0 0 4px' }}>
                  <span style={{ color: T.muted, minWidth: 78 }}>{k}</span>
                  <span style={{ color: T.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status da mensalidade */}
          {financeiroOk && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: T.muted, margin: '0 0 6px' }}>Status da mensalidade</p>
              {atleta.bolsista ? (
                <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}30`, color: T.green, borderRadius: 12, padding: '10px 12px', fontWeight: 800, fontFamily: SYNE, fontSize: 14 }}>🎓 Bolsista</div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 12px', background: emDia ? '#DCF3E5' : '#F3F4F6', color: emDia ? '#15803D' : '#9CA3AF', fontWeight: 800, fontFamily: SYNE, fontSize: 14 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 11, background: emDia ? '#16A34A' : '#D1D5DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</span> Em dia
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 12px', background: !emDia ? '#FDECEC' : '#F3F4F6', color: !emDia ? '#B91C1C' : '#9CA3AF', fontWeight: 800, fontFamily: SYNE, fontSize: 14 }}>
                    <span style={{ fontSize: 15 }}>🕒</span> Atrasado
                  </div>
                </div>
              )}
            </div>
          )}

          {/* dados de cadastro */}
          <div style={{ marginTop: 12 }}>
            {[
              nascimento && ['Nascimento', nascimento],
              atleta.cpf && ['CPF', atleta.cpf],
              atleta.rg && ['RG', atleta.rg],
              atleta.telefone && ['Telefone', atleta.telefone],
              !atleta.bolsista && atleta.diaVencimento && ['Vencimento', 'Dia ' + atleta.diaVencimento],
              irmaos.length > 0 && ['Irmão(s) de', irmaos.map((i) => i.nome).join(', ')],
            ].filter(Boolean).map((row) => (
              <div key={row![0] as string} style={{ ...ROW, marginBottom: 6, paddingBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.muted }}>{row![0]}</span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600, textAlign: 'right' }}>{row![1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CONDUTAS */}
        <Condutas atletaId={atleta.id} itens={condutas} />

        {/* RESUMO DE MENSALIDADES */}
        {financeiroOk && !atleta.bolsista && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <a href="#financeiro" style={{ textDecoration: 'none', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 18, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 17, background: '#FDBA74', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💲</span>
                  <span style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, lineHeight: 1.2 }}>Mensalidades a pagar</span>
                </div>
                <p style={{ margin: '10px 0 0', color: T.text }}><span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 32 }}>{qtdPendente}</span> <span style={{ fontSize: 12, color: T.muted }}>{qtdPendente === 1 ? 'mensalidade' : 'mensalidades'}</span></p>
                {totalPendente > 0 && <p style={{ margin: 0, fontSize: 11.5, color: '#C2410C', fontWeight: 700 }}>R$ {totalPendente.toFixed(2).replace('.', ',')}</p>}
              </a>
              <a href="#financeiro" style={{ textDecoration: 'none', background: qtdVencido ? '#FEF2F2' : '#F9FAFB', border: `1px solid ${qtdVencido ? '#FECACA' : '#E5E7EB'}`, borderRadius: 18, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 17, background: qtdVencido ? '#FCA5A5' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📅</span>
                  <span style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, lineHeight: 1.2 }}>Em atraso</span>
                </div>
                <p style={{ margin: '10px 0 0', color: qtdVencido ? '#B91C1C' : T.text }}><span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 32 }}>{qtdVencido}</span> <span style={{ fontSize: 12, color: T.muted }}>{qtdVencido === 1 ? 'mês em atraso' : 'meses em atraso'}</span></p>
                {totalVencido > 0 && <p style={{ margin: 0, fontSize: 11.5, color: '#B91C1C', fontWeight: 700 }}>R$ {totalVencido.toFixed(2).replace('.', ',')}</p>}
              </a>
            </div>

            <div style={{ ...CARD, borderRadius: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: pagas.length ? 10 : 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#E7F5ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: T.text, margin: 0 }}>Mensalidades pagas</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Últimas mensalidades quitadas</p>
                </div>
              </div>
              {pagas.length === 0 ? (
                <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', margin: '10px 0 0' }}>Nenhum pagamento registrado ainda.</p>
              ) : pagas.map(c => (
                <a key={c.id} href={c.reciboToken ? `/recibo/${c.reciboToken}` : '#financeiro'} target={c.reciboToken ? '_blank' : undefined} rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', borderTop: `1px solid ${T.border}`, textDecoration: 'none', color: T.text }}>
                  <span style={{ fontSize: 16 }}>🗓️</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{mesRef(c)}</span>
                  <span style={{ background: '#DCF3E5', color: '#15803D', fontWeight: 800, fontSize: 12, borderRadius: 999, padding: '4px 10px' }}>✓ Pago</span>
                  <span style={{ color: T.muted }}>›</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* CONQUISTAS */}
        <Conquistas atletaId={atleta.id} itens={premios} podeEditar={true} />

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
            <p id="financeiro" style={LABEL}>Todas as cobranças</p>
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
                {cobrancas.map(c => {
                  const agregada = c.familiaCobrancaId ? agregadasPorId.get(c.familiaCobrancaId) : null

                  // Filho de família: essa linha é só a ficha interna, a
                  // cobrança de verdade (com PIX e ações) é a agregada.
                  if (c.familiaCobrancaId) {
                    const venc = agregada?.vencimento || c.vencimento
                    return (
                      <div key={c.id} style={{ background: T.surface2, borderRadius: 10, padding: '10px 12px', border: `1px dashed ${T.border}` }}>
                        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 8px' }}>
                          👨‍👩‍👧 Incluída na cobrança da família (R$ {Number(agregada?.valor ?? c.valor).toFixed(2)}) — vencimento{' '}
                          {new Date(venc.includes('T') ? venc : venc + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                        <a href={`/pagar/${c.familiaCobrancaId}`} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.primary}44`, background: `${T.primary}12`, color: T.sky, textDecoration: 'none', fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          💳 Ver/Pagar cobrança da família
                        </a>
                      </div>
                    )
                  }

                  return (
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
                  )
                })}
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

        {financeiroOk && !atleta.bolsista && (
          <div style={CARD}>
            <p style={LABEL}>Link de Pagamentos</p>
            <p style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Mostra todas as mensalidades pendentes juntas, cada uma com seu QR Code — envie em vez de um link por mês.</p>
            <p style={{ fontSize: 11, color: T.muted, wordBreak: 'break-all', marginBottom: 10 }}>{'https://gestaofc.com.br/pagar-atleta/' + atleta.id}</p>
            <CopiarLink link={'https://gestaofc.com.br/pagar-atleta/' + atleta.id} />
          </div>
        )}

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
