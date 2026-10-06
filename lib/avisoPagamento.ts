import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarPush } from '@/lib/push'
import { msgPagamentoConfirmado } from '@/lib/whatsapp-templates'

/**
 * Aviso de pagamento confirmado + link do recibo, para TODO caminho de baixa
 * (webhook Asaas, baixa manual, "Pago + Recibo"). Antes so o webhook avisava,
 * e a baixa manual (a mais usada) nao mandava nada ao pai.
 *
 * Canais: push no celular (quem ativou os avisos) + WhatsApp pelo template
 * aprovado `pagamento_confirmado`. O link do recibo vai dentro da variavel de
 * referencia ({{3}}) — assim nao precisa aprovar template novo na Meta.
 *
 * O resultado fica gravado na propria cobranca (avisoPagamentoStatus/Detalhe),
 * para nao depender dos logs da Vercel (que guardam so 1 dia).
 * Chamar so do servidor.
 */

export const SITE = 'https://gestaofc.com.br'

export function linkRecibo(token: string) {
  return `${SITE}/recibo/${token}`
}

function novoToken() {
  return randomBytes(12).toString('base64url') // 16 caracteres, nao adivinhavel
}

/** Garante que a cobranca tem token de recibo e devolve o token. */
export async function garantirReciboToken(cobrancaId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('Cobranca').select('reciboToken').eq('id', cobrancaId).maybeSingle()
  if (!data) return null
  if (data.reciboToken) return data.reciboToken as string
  const token = novoToken()
  const { data: up } = await supabaseAdmin.from('Cobranca').update({ reciboToken: token })
    .eq('id', cobrancaId).is('reciboToken', null).select('reciboToken')
  if (up?.length) return token
  // outra chamada gravou primeiro: usa o dela
  const { data: again } = await supabaseAdmin.from('Cobranca').select('reciboToken').eq('id', cobrancaId).maybeSingle()
  return (again?.reciboToken as string) ?? null
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function referenciaCobranca(c: { descricao?: string | null; competencia?: string | null; vencimento?: string | null }) {
  if (c.descricao && c.descricao.trim()) return c.descricao.trim()
  const base = String(c.competencia || c.vencimento || '').slice(0, 7)
  const [a, m] = base.split('-').map(Number)
  return a && m ? `Mensalidade ${MESES[m - 1]}/${a}` : 'Mensalidade'
}

export type ResultadoAviso = {
  status: 'ENVIADO' | 'FALHOU' | 'SEM_CANAL' | 'JA_ENVIADO' | 'NAO_PAGO' | 'NAO_ENCONTRADA'
  detalhe: string
  link?: string
}

const curto = (s: string, n = 280) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

function erroLegivel(e: unknown): string {
  const msg = (e as Error)?.message || String(e)
  if (/132001|does not exist in pt_BR|template name/i.test(msg)) return 'modelo pagamento_confirmado não aprovado/encontrado na Meta'
  if (/131026|not.*whatsapp/i.test(msg)) return 'número sem WhatsApp'
  if (/190|access token|OAuth/i.test(msg)) return 'token da Meta expirado ou inválido'
  if (/não configurados|nao configurad/i.test(msg)) return 'WhatsApp oficial (Meta) não configurado na Vercel'
  return curto(msg, 160)
}

/**
 * Envia o aviso de pagamento. Idempotente: so envia uma vez por cobranca,
 * a menos que `forcar` (botao "Reenviar recibo").
 */
export async function avisarPagamento(cobrancaId: string, opts: { forcar?: boolean; escolaId?: string } = {}): Promise<ResultadoAviso> {
  let q = supabaseAdmin.from('Cobranca')
    .select('id, escolaId, atletaId, atletaNome, valor, valorPago, descricao, competencia, vencimento, status, avisoPagamentoEm')
    .eq('id', cobrancaId)
  if (opts.escolaId) q = q.eq('escolaId', opts.escolaId)
  const { data: c } = await q.maybeSingle()
  if (!c) return { status: 'NAO_ENCONTRADA', detalhe: 'Cobrança não encontrada' }
  if (c.status !== 'PAGO') return { status: 'NAO_PAGO', detalhe: 'Cobrança ainda não está paga' }

  // trava contra envio duplo (o Asaas manda PAYMENT_RECEIVED e PAYMENT_CONFIRMED)
  if (!opts.forcar) {
    const { data: trava } = await supabaseAdmin.from('Cobranca')
      .update({ avisoPagamentoEm: new Date().toISOString(), avisoPagamentoStatus: 'ENVIANDO' })
      .eq('id', c.id).is('avisoPagamentoEm', null).select('id')
    if (!trava?.length) return { status: 'JA_ENVIADO', detalhe: 'Aviso já enviado antes' }
  }

  const token = await garantirReciboToken(c.id)
  const link = token ? linkRecibo(token) : SITE

  const [{ data: atleta }, { data: responsavel }] = await Promise.all([
    c.atletaId
      ? supabaseAdmin.from('Atleta').select('nome').eq('id', c.atletaId).maybeSingle()
      : Promise.resolve({ data: null as { nome: string } | null }),
    c.atletaId
      ? supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', c.atletaId)
          .order('principal', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null as { nome: string; whatsapp: string | null } | null }),
  ])

  const nomeAtleta = (c.atletaNome as string)?.trim() || atleta?.nome || 'Atleta'
  const valor = Number(c.valorPago ?? c.valor ?? 0)
  const referencia = referenciaCobranca(c)
  const valorTxt = valor.toFixed(2).replace('.', ',')

  const partes: string[] = []
  let algumOk = false
  let algumCanal = false

  // 1) push no celular
  if (c.atletaId) {
    try {
      const r = await enviarPush({
        escolaId: c.escolaId, atletaId: c.atletaId,
        title: '✅ Pagamento confirmado',
        body: `${nomeAtleta} · R$ ${valorTxt} · ${referencia}. Toque para ver o recibo.`,
        url: token ? `/recibo/${token}` : '/',
      })
      if (r.celulares > 0) {
        algumCanal = true
        if (r.enviados > 0) { algumOk = true; partes.push(`Celular: ${r.enviados} aviso(s)`) }
        else partes.push('Celular: falhou')
      }
    } catch (e) {
      algumCanal = true
      partes.push('Celular: ' + erroLegivel(e))
    }
  }

  // 2) WhatsApp (template aprovado; link do recibo na referencia)
  if (responsavel?.whatsapp) {
    algumCanal = true
    const via = process.env.WHATSAPP_PROVIDER === 'meta' ? 'oficial' : 'Evolution'
    try {
      const r = await msgPagamentoConfirmado({
        telefone: responsavel.whatsapp,
        nomeResp: responsavel.nome?.split(' ')[0] || 'Responsável',
        nomeAtleta,
        valor,
        referencia: `${referencia} · Recibo: ${link}`,
        escolaId: c.escolaId,
      }) as { ok?: boolean; erro?: string } | undefined
      // a Evolution nao lanca erro: devolve { ok: false }
      if (r && typeof r === 'object' && r.ok === false) throw new Error(r.erro || 'Evolution recusou o envio')
      algumOk = true
      partes.push(`WhatsApp (${via}): enviado`)
    } catch (e) {
      partes.push(`WhatsApp (${via}): ` + erroLegivel(e))
    }
  } else {
    partes.push('WhatsApp: responsável sem número')
  }

  const status: ResultadoAviso['status'] = algumOk ? 'ENVIADO' : algumCanal ? 'FALHOU' : 'SEM_CANAL'
  const detalhe = curto(partes.join(' · '))

  await supabaseAdmin.from('Cobranca').update({
    avisoPagamentoEm: new Date().toISOString(),
    avisoPagamentoStatus: status,
    avisoPagamentoDetalhe: detalhe,
  }).eq('id', c.id)

  if (!algumOk) console.warn('Aviso de pagamento nao entregue:', c.id, detalhe)
  return { status, detalhe, link }
}

/** Para usar depois de uma baixa: nunca derruba a baixa se o aviso falhar. */
export async function avisarPagamentoSeguro(cobrancaId: string, escolaId?: string) {
  try {
    return await avisarPagamento(cobrancaId, { escolaId })
  } catch (e) {
    console.error('Erro aviso pagamento:', (e as Error).message)
    return null
  }
}
