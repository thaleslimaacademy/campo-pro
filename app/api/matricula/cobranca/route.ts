import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarCobrancaPix, getPixQrCode } from '@/lib/asaas'

const ASAAS_URL = 'https://api.asaas.com/v3'

async function criarOuBuscarCliente(apiKey: string, dados: {
  nome: string; cpf: string; telefone: string; email: string
}): Promise<string> {
  // 1. Buscar por CPF se válido
  if (dados.cpf.length >= 11) {
    const res = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${dados.cpf}`, {
      headers: { access_token: apiKey },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.data?.[0]?.id) return data.data[0].id
    }
  }

  // 2. Criar cliente
  const payload: Record<string, string> = { name: dados.nome }
  if (dados.cpf.length >= 11) payload.cpfCnpj = dados.cpf
  if (dados.telefone) payload.phone = dados.telefone
  if (dados.email) payload.email = dados.email

  const res = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: apiKey },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json()
  console.log('[asaas/cliente]', JSON.stringify(data))

  if (!data.id) throw new Error(
    data.errors?.[0]?.description || data.message || 'Erro ao criar cliente Asaas'
  )
  return data.id
}

// Rota pública — sem Clerk
export async function POST(req: NextRequest) {
  try {
    const { matriculaId, escolaId, metodoPagamento } = await req.json()

    if (!matriculaId || !escolaId || !metodoPagamento) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Buscar matrícula
    const { data: mat } = await supabaseAdmin
      .from('Matricula').select('*').eq('id', matriculaId).eq('escolaId', escolaId).single()
    if (!mat) return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 })

    // Buscar escola
    const { data: escola } = await supabaseAdmin
      .from('Escola').select('valorMatricula, asaasApiKey, whatsapp, nome').eq('id', escolaId).single()
    if (!escola) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

    const valor = Number(escola.valorMatricula || 0)
    if (valor <= 0) return NextResponse.json({ error: 'Taxa de matrícula não configurada' }, { status: 400 })

    const apiKey = escola.asaasApiKey || process.env.ASAAS_API_KEY || ''
    if (!apiKey) return NextResponse.json({ error: 'Chave Asaas não configurada' }, { status: 400 })

    // Criar ou buscar cliente
    let asaasCustomerId: string
    try {
      asaasCustomerId = await criarOuBuscarCliente(apiKey, {
        nome: mat.nomeResponsavel || mat.nomeAtleta,
        cpf: (mat.cpfResponsavel || mat.cpf || '').replace(/\D/g, ''),
        telefone: (mat.whatsappResponsavel || '').replace(/\D/g, ''),
        email: mat.emailResponsavel || '',
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 3)
    const dueDate = vencimento.toISOString().slice(0, 10)
    const descricao = `Taxa de matrícula — ${mat.nomeAtleta}`
    const cobrancaId = crypto.randomUUID()

    // PIX
    if (metodoPagamento === 'PIX') {
      const cobranca = await criarCobrancaPix(apiKey, {
        customer: asaasCustomerId,
        billingType: 'PIX',
        value: valor,
        dueDate,
        description: descricao,
      })
      if (!cobranca.id) {
        console.error('[asaas/pix]', JSON.stringify(cobranca))
        return NextResponse.json({ error: 'Erro ao criar cobrança PIX', detalhes: cobranca }, { status: 400 })
      }

      const qrCode = await getPixQrCode(apiKey, cobranca.id)

      await supabaseAdmin.from('Cobranca').insert({
        id: cobrancaId, escolaId,
        atletaId: mat.atletaId || null,
        valor, vencimento: dueDate,
        status: 'PENDENTE',
        asaasId: cobranca.id,
        pixCopiaCola: qrCode.payload || null,
        pixQrCode: qrCode.encodedImage || null,
        descricao, tipo: 'MATRICULA',
        atletaNome: mat.nomeAtleta,
      })

      return NextResponse.json({
        ok: true, metodo: 'PIX', valor,
        pixCopiaCola: qrCode.payload,
        pixQrCode: qrCode.encodedImage,
      })
    }

    // CARTÃO
    if (metodoPagamento === 'CARTAO') {
      const res = await fetch(`${ASAAS_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', access_token: apiKey },
        body: JSON.stringify({
          customer: asaasCustomerId,
          billingType: 'CREDIT_CARD',
          value: valor,
          dueDate,
          description: descricao,
        }),
        signal: AbortSignal.timeout(10000),
      })
      const linkData = await res.json()
      console.log('[asaas/cartao]', JSON.stringify(linkData))

      if (!linkData.id) {
        return NextResponse.json({ error: 'Erro ao criar cobrança cartão', detalhes: linkData }, { status: 400 })
      }

      await supabaseAdmin.from('Cobranca').insert({
        id: cobrancaId, escolaId,
        atletaId: mat.atletaId || null,
        valor, vencimento: dueDate,
        status: 'PENDENTE',
        asaasId: linkData.id,
        descricao, tipo: 'MATRICULA',
        atletaNome: mat.nomeAtleta,
      })

      return NextResponse.json({
        ok: true, metodo: 'CARTAO', valor,
        linkPagamento: linkData.invoiceUrl || null,
      })
    }

    return NextResponse.json({ error: 'Método inválido' }, { status: 400 })

  } catch (err: any) {
    console.error('[matricula/cobranca]', err.message)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
