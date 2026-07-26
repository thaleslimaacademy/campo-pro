const BASE_URL = 'https://api.asaas.com/v3'

function headers(apiKey: string) {
  return { 'Content-Type': 'application/json', 'access_token': apiKey }
}

export async function criarClienteAsaas(apiKey: string, dados: {
  name: string; cpfCnpj: string; email?: string; phone?: string
  address?: string; addressNumber?: string; province?: string; postalCode?: string
}) {
  const res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(dados),
    signal: AbortSignal.timeout(10000),
  })
  const text = await res.text()
  console.log('📦 Asaas cliente raw:', text)
  return JSON.parse(text)
}

export async function criarCobrancaPix(apiKey: string, dados: {
  customer: string; billingType: 'PIX'; value: number; dueDate: string; description: string
  discount?: { value: number; dueDateLimitDays: number; type: 'FIXED' }
  fine?: { value: number }; interest?: { value: number }
}) {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(dados),
    signal: AbortSignal.timeout(10000),
  })
  const text = await res.text()
  console.log('📦 Asaas cobranca raw:', text)
  return JSON.parse(text)
}

export async function getPixQrCode(apiKey: string, paymentId: string) {
  const res = await fetch(`${BASE_URL}/payments/${paymentId}/pixQrCode`, {
    headers: headers(apiKey), signal: AbortSignal.timeout(10000),
  })
  const text = await res.text()
  console.log('📦 Asaas qrCode raw:', text)
  return JSON.parse(text)
}

export async function cancelarCobrancaAsaas(apiKey: string, asaasId: string) {
  const res = await fetch(`${BASE_URL}/payments/${asaasId}`, {
    method: 'DELETE', headers: headers(apiKey), signal: AbortSignal.timeout(10000),
  })
  const text = await res.text()
  console.log('📦 Asaas cancelar raw:', text)
  try { return JSON.parse(text) } catch { return { raw: text } }
}

export async function buscarClienteAsaas(apiKey: string, cpfCnpj: string) {
  const cpf = cpfCnpj.replace(/\D/g, '')
  const res = await fetch(`${BASE_URL}/customers?cpfCnpj=${cpf}`, {
    headers: headers(apiKey), signal: AbortSignal.timeout(10000),
  })
  const data = JSON.parse(await res.text())
  return data.data?.[0] || null
}

export async function criarCobrancaBoleto(apiKey: string, dados: {
  customer: string; billingType: 'BOLETO'; value: number; dueDate: string; description: string
  discount?: { value: number; dueDateLimitDays: number; type: 'FIXED' | 'PERCENTAGE' }
  fine?: { value: number }
  interest?: { value: number }
}) {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(dados),
    signal: AbortSignal.timeout(10000),
  })
  const text = await res.text()
  console.log('📦 Asaas boleto raw:', text)
  return JSON.parse(text)
}

/**
 * Cria uma assinatura recorrente com cartao de credito. Os dados do cartao
 * (numero, validade, cvv) sao enviados UMA VEZ so, direto pra Asaas — nunca
 * ficam salvos no nosso banco nem em log. A partir da 1a cobranca validada,
 * a Asaas cobra sozinha todo mes no cartao, sem nenhuma acao nossa ou do pai.
 */
export async function criarAssinaturaCartao(apiKey: string, dados: {
  customer: string
  value: number
  nextDueDate: string
  cycle: 'MONTHLY'
  description: string
  creditCard: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string }
  creditCardHolderInfo: { name: string; cpfCnpj: string; postalCode: string; addressNumber: string; email?: string; phone?: string }
  remoteIp: string
}) {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(dados),
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  console.log('📦 Asaas assinatura raw:', text.slice(0, 300)) // nunca loga o corpo inteiro (pode conter erro c/ dado sensivel ecoado)
  return JSON.parse(text)
}

export async function criarCobrancaGenerica(apiKey: string, dados: {
  customer: string; billingType: string; value?: number; dueDate: string; description: string
  installmentCount?: number; installmentValue?: number
}) {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(dados),
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  console.log('📦 Asaas genérico raw:', text)
  return JSON.parse(text)
}

export async function criarAssinatura(apiKey: string, dados: {
  customer: string; billingType: string; value: number
  nextDueDate: string; cycle: 'MONTHLY' | 'YEARLY'; description: string
}) {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: 'POST', headers: headers(apiKey), body: JSON.stringify(dados),
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  console.log('📦 Asaas assinatura raw:', text)
  return JSON.parse(text)
}

export async function buscarCobrancasDaAssinatura(apiKey: string, subscriptionId: string) {
  const res = await fetch(`${BASE_URL}/payments?subscription=${subscriptionId}`, {
    headers: headers(apiKey), signal: AbortSignal.timeout(10000),
  })
  const text = await res.text()
  console.log('📦 Asaas cobranças assinatura raw:', text)
  return JSON.parse(text)
}
