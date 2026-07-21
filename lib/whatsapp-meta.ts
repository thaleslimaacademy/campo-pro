/**
 * WhatsApp Business API — Meta Oficial
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Variáveis de ambiente necessárias (adicionar no Vercel):
 *   META_ACCESS_TOKEN        = Token de acesso permanente do App Meta
 *   META_PHONE_NUMBER_ID   = ID do número de telefone no Meta
 *   META_WABA_ID           = ID da conta WhatsApp Business
 *   META_WEBHOOK_VERIFY    = Token de verificação do webhook (você define)
 *
 * PROVIDER=meta  →  usa Meta Oficial
 * PROVIDER=evo   →  usa Evolution API (atual)
 */

const META_API = 'https://graph.facebook.com/v21.0'
const TOKEN    = () => process.env.META_ACCESS_TOKEN || ''
const PHONE_ID = () => process.env.META_PHONE_NUMBER_ID || ''

// ─── TEMPLATES APROVADOS ────────────────────────────────────────────────────
// Cada template precisa ser criado e aprovado no Meta Business Manager
// Nome do template deve ser SNAKE_CASE, idioma pt_BR
//
// TEMPLATE: cobranca_lembrete
//   "Olá {{1}}! 📅 A mensalidade de *{{2}}* vence em {{3}} dias.\n💰 Valor: R$ {{4}}\nPague agora: {{5}}"
//
// TEMPLATE: cobranca_vencimento
//   "Olá {{1}}! 👋 A mensalidade de *{{2}}* vence *hoje*.\n💰 Valor: R$ {{4}}\nPague agora: {{5}}"
//
// TEMPLATE: cobranca_atraso
//   "Olá {{1}}! ⚠️ A mensalidade de *{{2}}* está em atraso.\n💰 Valor: R$ {{4}}\nRegularize: {{5}}"
//
// TEMPLATE: pagamento_confirmado
//   "Olá {{1}}! ✅ Pagamento de *{{2}}* confirmado.\n💰 R$ {{4}} — {{3}}\nObrigado!"
//
// TEMPLATE: convocacao
//   "⚽ {{1}}\n📅 {{2}} às {{3}}\n📍 {{4}}\n\nVocê está convocado(a)!"

export type TemplateParams = {
  to: string                    // número com DDI: 5534999991234
  template: string              // nome do template aprovado
  params: string[]              // variáveis {{1}}, {{2}}, ...
  phoneNumberId?: string        // se escola tiver número próprio
}

// Formata número para padrão Meta (55 + DDD + número, sem símbolos)
function formatarNumero(tel: string): string {
  const limpo = tel.replace(/\D/g, '')
  return limpo.startsWith('55') ? limpo : '55' + limpo
}

// Envia mensagem via template aprovado
export async function enviarTemplateMeta({ to, template, params, phoneNumberId }: TemplateParams) {
  const phoneId = phoneNumberId || PHONE_ID()
  if (!phoneId || !TOKEN()) {
    throw new Error('META_ACCESS_TOKEN ou META_PHONE_NUMBER_ID não configurados')
  }

  const components = params.length > 0 ? [{
    type: 'body',
    parameters: params.map(p => ({ type: 'text', text: p })),
  }] : []

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatarNumero(to),
    type: 'template',
    template: {
      name: template,
      language: { code: 'pt_BR' },
      components,
    },
  }

  const res = await fetch(`${META_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Meta API erro: ${JSON.stringify(data)}`)
  console.log('📲 Meta WhatsApp enviado:', template, '->', to.slice(-4))
  return data
}

// Envia mensagem de texto livre (só funciona dentro de janela de 24h — conversa iniciada pelo usuário)
export async function enviarTextoMeta(to: string, texto: string, phoneNumberId?: string) {
  const phoneId = phoneNumberId || PHONE_ID()
  if (!phoneId || !TOKEN()) throw new Error('Meta não configurado')

  const res = await fetch(`${META_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formatarNumero(to),
      type: 'text',
      text: { body: texto },
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Meta texto erro: ${JSON.stringify(data)}`)
  return data
}

// Verifica se a API Meta está configurada
export function metaConfigurado(): boolean {
  return !!(process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID)
}
