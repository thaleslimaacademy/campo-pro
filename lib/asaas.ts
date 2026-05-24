const ASAAS_URL = process.env.ASAAS_URL || 'https://api.asaas.com/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!

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
  const res = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    body: JSON.stringify(dados),
  })
  return res.json()
}

export async function criarCobrancaPix(dados: {
  customer: string
  billingType: 'PIX'
  value: number
  dueDate: string
  description: string
}) {
  const res = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    body: JSON.stringify(dados),
  })
  return res.json()
}

export async function getPixQrCode(paymentId: string) {
  const res = await fetch(`${ASAAS_URL}/payments/${paymentId}/pixQrCode`, {
    headers: {
      'access_token': ASAAS_API_KEY,
    },
  })
  return res.json()
}