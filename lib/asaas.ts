function getApiKey(): string {
  return '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjRjOGE3ZDljLWMxYTAtNDgwNS1hNjI1LWFjOGZlN2RkNmNiNzo6JGFhY2hfOWQxNWUwYzktY2M3Zi00YzU1LTgxYTctYTAzYTM2M2IzNTNl'
}

function getBaseUrl(): string {
  return 'https://sandbox.asaas.com/api/v3'
}

export async function criarClienteAsaas(dados: {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  address?: string
  addressNumber?: string
  province?: string
  postalCode?: string
}) {
  const res = await fetch(`${getBaseUrl()}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': getApiKey(),
    },
    body: JSON.stringify(dados),
    signal: AbortSignal.timeout(10000),
  })

  const text = await res.text()
  console.log('📦 Asaas cliente raw:', text)
  return JSON.parse(text)
}

export async function criarCobrancaPix(dados: {
  customer: string
  billingType: 'PIX'
  value: number
  dueDate: string
  description: string
}) {
  const res = await fetch(`${getBaseUrl()}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': getApiKey(),
    },
    body: JSON.stringify(dados),
    signal: AbortSignal.timeout(10000),
  })

  const text = await res.text()
  console.log('📦 Asaas cobranca raw:', text)
  return JSON.parse(text)
}

export async function getPixQrCode(paymentId: string) {
  const res = await fetch(`${getBaseUrl()}/payments/${paymentId}/pixQrCode`, {
    headers: {
      'access_token': getApiKey(),
    },
    signal: AbortSignal.timeout(10000),
  })

  const text = await res.text()
  console.log('📦 Asaas qrCode raw:', text)
  return JSON.parse(text)
}