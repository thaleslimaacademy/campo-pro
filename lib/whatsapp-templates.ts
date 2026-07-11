/**
 * Templates padronizados para o GestãoFC
 * Cada função mapeia para um template aprovado na Meta
 * Os nomes dos templates precisam ser criados no Meta Business Manager
 */

import { enviarTemplateMeta, enviarTextoMeta, metaConfigurado } from './whatsapp-meta'
import { enviarWhatsApp as enviarEvo } from './whatsapp'

const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`

// ─── SWITCH DE PROVIDER ─────────────────────────────────────────────────────
// WHATSAPP_PROVIDER=meta  →  API Oficial Meta (zero ban)
// WHATSAPP_PROVIDER=evo   →  Evolution API (atual)
function usaMeta(): boolean {
  return process.env.WHATSAPP_PROVIDER === 'meta' && metaConfigurado()
}

// ─── TEMPLATES ──────────────────────────────────────────────────────────────

// D-3: lembrete 3 dias antes do vencimento
export async function msgLembreteD3(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  valor: number
  dataVenc: string
  linkPagamento: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'cobranca_lembrete',
      params: [params.nomeResp, params.nomeAtleta, '3', brl(params.valor), params.linkPagamento],
    })
  }
  // Fallback Evolution
  const msg = `Ola ${params.nomeResp}! 📅\n\nA mensalidade de *${params.nomeAtleta}* vence em *3 dias* (${params.dataVenc}).\n\n💰 Valor: *${brl(params.valor)}*\n\n🔗 Pague agora:\n${params.linkPagamento}\n\nPague em dia e evite multa e juros!`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Dia do vencimento
export async function msgVencimentoHoje(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  valor: number
  dataVenc: string
  linkPagamento: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'cobranca_vencimento',
      params: [params.nomeResp, params.nomeAtleta, brl(params.valor), params.linkPagamento],
    })
  }
  const msg = `Ola ${params.nomeResp}! 👋\n\nA mensalidade de *${params.nomeAtleta}* vence *hoje* (${params.dataVenc}).\n\n💰 Valor: *${brl(params.valor)}*\n\n🔗 Pague agora:\n${params.linkPagamento}`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// D+1, D+4, D+10: mensagem de atraso
export async function msgAtraso(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  valor: number
  diasAtraso: number
  linkPagamento: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'cobranca_atraso',
      params: [params.nomeResp, params.nomeAtleta, brl(params.valor), params.linkPagamento],
    })
  }
  const emoji = params.diasAtraso >= 10 ? '🚨' : '⚠️'
  const msg = `Ola ${params.nomeResp}! ${emoji}\n\nA mensalidade de *${params.nomeAtleta}* está em atraso há *${params.diasAtraso} dias*.\n\n💰 Valor: *${brl(params.valor)}*\n\n🔗 Regularize agora:\n${params.linkPagamento}`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Confirmação de pagamento
export async function msgPagamentoConfirmado(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  valor: number
  referencia: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'pagamento_confirmado',
      params: [params.nomeResp, params.nomeAtleta, params.referencia, brl(params.valor)],
    })
  }
  const msg = `Ola ${params.nomeResp}! ✅\n\nPagamento de *${params.nomeAtleta}* confirmado.\n\n💰 ${brl(params.valor)} — ${params.referencia}\n\nObrigado! 🙏`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Convocação
export async function msgConvocacao(params: {
  telefone: string
  nomeAtleta: string
  titulo: string
  data: string
  horario: string
  local: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'convocacao',
      params: [params.titulo, params.data, params.horario, params.local],
    })
  }
  const msg = `⚽ *${params.titulo.toUpperCase()}*\n\n📅 ${params.data} às ${params.horario}\n📍 ${params.local}\n\n*${params.nomeAtleta}* está convocado(a)!\n\nConfirme sua presença.`
  return enviarEvo(params.telefone, msg, params.escolaId)
}
