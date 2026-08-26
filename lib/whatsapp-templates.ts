/**
 * Templates padronizados para o GestãoFC
 * Cada função mapeia para um template aprovado na Meta
 * Os nomes dos templates precisam ser criados no Meta Business Manager
 */

import { enviarTemplateMeta, enviarTextoMeta, metaConfigurado } from './whatsapp-meta'
import { enviarWhatsApp as enviarEvo } from './whatsapp'

const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`
// Os corpos aprovados na Meta ja tem "R$" fixo no texto antes da variavel de
// valor (ex: "Valor: R$ {{4}}") — se a variavel vier com brl() de novo, sai
// duplicado ("R$ R$ 120,00"). Nos templates Meta usa sempre isso; brl() so
// entra no fallback Evolution (texto livre, sem "R$" fixo no corpo).
const valorFmt = (n: number) => Number(n).toFixed(2).replace('.', ',')

// ─── SWITCH DE PROVIDER ─────────────────────────────────────────────────────
// WHATSAPP_PROVIDER=meta  →  API Oficial Meta (zero ban)
// WHATSAPP_PROVIDER=evo   →  Evolution API (atual)
function usaMeta(): boolean {
  return process.env.WHATSAPP_PROVIDER === 'meta' && metaConfigurado()
}

// ─── TEMPLATES ──────────────────────────────────────────────────────────────

// Lembrete previo — 'dias' e quantos dias faltam para o vencimento (padrao 3)
export async function msgLembreteD3(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  valor: number
  dataVenc: string
  linkPagamento: string
  dias?: number
  escolaId?: string
}) {
  const dias = String(params.dias ?? 3)
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'cobranca_lembrete',
      params: [params.nomeResp, params.nomeAtleta, dias, valorFmt(params.valor), params.linkPagamento],
    })
  }
  // Fallback Evolution
  const msg = `Ola ${params.nomeResp}! 📅\n\nA mensalidade de *${params.nomeAtleta}* vence em *${dias} dias* (${params.dataVenc}).\n\n💰 Valor: *${brl(params.valor)}*\n\n🔗 Pague agora:\n${params.linkPagamento}\n\nPague em dia e evite multa e juros!`
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
      params: [params.nomeResp, params.nomeAtleta, valorFmt(params.valor), params.linkPagamento],
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
      params: [params.nomeResp, params.nomeAtleta, valorFmt(params.valor), params.linkPagamento],
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
      params: [params.nomeResp, params.nomeAtleta, params.referencia, valorFmt(params.valor)],
    })
  }
  const msg = `Ola ${params.nomeResp}! ✅\n\nPagamento de *${params.nomeAtleta}* confirmado.\n\n💰 ${brl(params.valor)} — ${params.referencia}\n\nObrigado! 🙏`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Convocação
// NOTA: o template 'convocacao' na Meta esta sendo editado (26 ago) pra
// ganhar o 5o parametro (linkConfirmacao) — antes disso a nova versao for
// aprovada, chamadas com linkConfirmacao vao falhar (parametro a mais que o
// template aprovado aceita); o caller ja trata erro com try/catch.
export async function msgConvocacao(params: {
  telefone: string
  nomeAtleta: string
  titulo: string
  data: string
  horario: string
  local: string
  linkConfirmacao?: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'convocacao',
      params: params.linkConfirmacao
        ? [params.titulo, params.data, params.horario, params.local, params.linkConfirmacao]
        : [params.titulo, params.data, params.horario, params.local],
    })
  }
  const linkTexto = params.linkConfirmacao ? `\n\n🔗 Confirme sua presença:\n${params.linkConfirmacao}` : '\n\nConfirme sua presença.'
  const msg = `⚽ *${params.titulo.toUpperCase()}*\n\n📅 ${params.data} às ${params.horario}\n📍 ${params.local}\n\n*${params.nomeAtleta}* está convocado(a)!${linkTexto}`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Matrícula aprovada — antes ficava inline em app/api/whatsapp-aprovacao/route.ts,
// trazido pra cá pra seguir o mesmo padrão dos outros templates
export async function msgMatriculaAprovada(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  nomeEscola: string
  cidadeEstado: string
  linkPais: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'matricula_aprovada',
      params: [params.nomeResp, params.nomeAtleta, params.nomeEscola, params.linkPais],
    })
  }
  const msg =
    `Ola ${params.nomeResp}! 👋\n\n` +
    `A pre-matricula de *${params.nomeAtleta}* foi *APROVADA*! ✅\n\n` +
    `Seu filho(a) ja esta matriculado(a) na *${params.nomeEscola}*.\n\n` +
    `Acesse o link abaixo para acompanhar presenca e mensalidades:\n` +
    `${params.linkPais}\n\n` +
    `Bem-vindo(a) a familia! ⚽\n` +
    `_${params.nomeEscola} - ${params.cidadeEstado}_`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Matrícula recusada — TEMPLATE NOVO (precisa ser criado e aprovado na Meta
// antes de rodar com WHATSAPP_PROVIDER=meta, senão cai no fallback Evolution,
// que está fora do ar)
export async function msgMatriculaRecusada(params: {
  telefone: string
  nomeResp: string
  nomeAtleta: string
  nomeEscola: string
  cidadeEstado: string
  contato?: string
  escolaId?: string
}) {
  const contato = params.contato || 'nossa equipe'
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'matricula_recusada',
      params: [params.nomeResp, params.nomeAtleta, contato, params.nomeEscola],
    })
  }
  const msg =
    `Ola ${params.nomeResp},\n\n` +
    `Informamos que a pre-matricula de *${params.nomeAtleta}* nao foi aprovada no momento.\n\n` +
    `Entre em contato conosco para mais informacoes: ${contato}\n\n` +
    `_${params.nomeEscola} - ${params.cidadeEstado}_`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Pedido da loja confirmado — TEMPLATE NOVO. O corpo aprovado nao carrega a
// lista de itens (tamanho variavel nao da pra template Meta): manda so nome,
// total e tipo de entrega; os itens continuam visiveis pro comprador na tela
// do pedido.
export async function msgPedidoConfirmado(params: {
  telefone: string
  nomeComprador: string
  valor: number
  tipoEntrega: 'RETIRADA' | string
  escolaId?: string
}) {
  const primeiroNome = params.nomeComprador.split(' ')[0]
  const entregaTexto = params.tipoEntrega === 'RETIRADA' ? 'Retirada na escola' : 'Entrega no endereço'
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'pedido_confirmado',
      params: [primeiroNome, valorFmt(params.valor), entregaTexto],
    })
  }
  const msg = `✅ *Pedido confirmado!*\n\nOlá, *${primeiroNome}*! 🎉\n\n💰 Total: *${brl(params.valor)}*\n📦 Entrega: *${entregaTexto}*\n\nEm breve entraremos em contato! 👊\n_GestãoFC · gestaofc.com.br_`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Plano da escola ativado (assinatura GestãoFC) — TEMPLATE NOVO
export async function msgPlanoAtivado(params: {
  telefone: string
  nomeEscola: string
  escolaId?: string
}) {
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'plano_ativado',
      params: [params.nomeEscola],
    })
  }
  const msg = `🏆 *GestãoFC — Plano Ativado!*\n\nOlá! Seu pagamento foi confirmado e o *${params.nomeEscola}* já está ativo. 🎉\n\nAcesse: *gestaofc.com.br*\n\n_Bem-vindo(a)!_`
  return enviarEvo(params.telefone, msg, params.escolaId)
}

// Fotos da galeria prontas para download — TEMPLATE NOVO. O link aponta pra
// uma pagina propria (/fotos-compra/[id]) que gera as signed URLs na hora —
// o template Meta nao aguenta uma lista de links de tamanho variavel.
export async function msgFotosProntas(params: {
  telefone: string
  nomeComprador: string
  linkDownload: string
  escolaId?: string
}) {
  const primeiroNome = params.nomeComprador.split(' ')[0]
  if (usaMeta()) {
    return enviarTemplateMeta({
      to: params.telefone,
      template: 'fotos_prontas',
      params: [primeiroNome, params.linkDownload],
    })
  }
  const msg = `✅ *Pagamento confirmado!*\n\nOlá, *${primeiroNome}*! 🎉\n\nSuas fotos estão prontas. Acesse o link abaixo para baixar:\n${params.linkDownload}\n\n_GestãoFC · gestaofc.com.br_`
  return enviarEvo(params.telefone, msg, params.escolaId)
}
