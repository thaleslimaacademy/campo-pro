import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'

// Rota pública — sem Clerk (responsável externo)
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

    // Buscar escola (valor taxa + asaas key + whatsapp admin)
    const { data: escola } = await supabaseAdmin
      .from('Escola').select('valorMatricula, asaasApiKey, whatsapp, nome').eq('id', escolaId).single()
    if (!escola) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

    const valor = Number(escola.valorMatricula || 0)
    if (valor <= 0) return NextResponse.json({ error: 'Valor da taxa de matrícula não configurado' }, { status: 400 })

    const apiKey = escola.asaasApiKey || process.env.ASAAS_API_KEY || ''
    if (!apiKey) return NextResponse.json({ error: 'Chave Asaas não configurada' }, { status: 400 })

    // Criar ou buscar cliente Asaas pelo CPF do responsável
    const cpf = (mat.cpfResponsavel || mat.cpf || '00000000000').replace(/\D/g, '')
    let asaasCustomerId: string | null = null

    // Tenta buscar cliente existente pelo CPF
    const busca = await fetch(
      `https://api-sandbox.asaas.com/api/v3/customers?cpfCnpj=${cpf}`,
      { headers: { access_token: apiKey }, signal: AbortSignal.timeout(8000) }
    )
    const buscaData = await busca.json()
    if (buscaData.data && buscaData.data.length > 0) {
      asaasCustomerId = buscaData.data[0].id
    } else {
      const clienteRes = await fetch('https://api-sandbox.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', access_token: apiKey },
        body: JSON.stringify({
          name: mat.nomeResponsavel,
          cpfCnpj: cpf,
          phone: mat.whatsappResponsavel || '',
          email: mat.emailResponsavel || '',
        }),
        signal: AbortSignal.timeout(8000),
      })
      const clienteData = await clienteRes.json()
      if (clienteData.errors || !clienteData.id) {
        return NextResponse.json({ error: 'Erro ao criar cliente Asaas', detalhes: clienteData }, { status: 400 })
      }
      asaasCustomerId = clienteData.id
    }

    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 3)
    const dueDate = vencimento.toISOString().slice(0, 10)
    const descricao = `Taxa de matrícula — ${mat.nomeAtleta}`

    // PIX
    if (metodoPagamento === 'PIX') {
      const cobranca = await criarCobrancaPix(apiKey, {
        customer: asaasCustomerId!,
        billingType: 'PIX',
        value: valor,
        dueDate,
        description: descricao,
      })
      if (cobranca.errors || !cobranca.id) {
        return NextResponse.json({ error: 'Erro ao criar cobrança PIX', detalhes: cobranca }, { status: 400 })
      }
      const qrCode = await getPixQrCode(apiKey, cobranca.id)

      await supabaseAdmin.from('Cobranca').insert({
        id: crypto.randomUUID(), escolaId, atletaId: mat.atletaId || matriculaId,
        valor, vencimento: dueDate, status: 'PENDENTE',
        asaasId: cobranca.id,
        pixCopiaCola: qrCode.payload || null,
        pixQrCode: qrCode.encodedImage || null,
        descricao, tipo: 'MATRICULA',
        atletaNome: mat.nomeAtleta,
      })

      return NextResponse.json({
        ok: true,
        metodo: 'PIX',
        valor,
        pixCopiaCola: qrCode.payload,
        pixQrCode: qrCode.encodedImage,
      })
    }

    // CARTÃO DE CRÉDITO — gera link de pagamento
    if (metodoPagamento === 'CARTAO') {
      const linkRes = await fetch('https://api-sandbox.asaas.com/api/v3/payments', {
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
      const linkData = await linkRes.json()
      if (linkData.errors || !linkData.id) {
        return NextResponse.json({ error: 'Erro ao criar cobrança cartão', detalhes: linkData }, { status: 400 })
      }

      await supabaseAdmin.from('Cobranca').insert({
        id: crypto.randomUUID(), escolaId, atletaId: mat.atletaId || matriculaId,
        valor, vencimento: dueDate, status: 'PENDENTE',
        asaasId: linkData.id,
        descricao, tipo: 'MATRICULA',
        atletaNome: mat.nomeAtleta,
      })

      return NextResponse.json({
        ok: true,
        metodo: 'CARTAO',
        valor,
        linkPagamento: linkData.invoiceUrl || null,
      })
    }

    return NextResponse.json({ error: 'Método inválido' }, { status: 400 })

  } catch (err: any) {
    console.error('[matricula/cobranca]', err.message)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
