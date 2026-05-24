import { NextRequest, NextResponse } from 'next/server'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    console.log('🔑 KEY:', process.env.ASAAS_API_KEY?.slice(0, 20))
    console.log('🌍 URL:', process.env.ASAAS_URL)

    const body = await req.json()
    console.log('📨 Body recebido:', JSON.stringify(body))

    const { atletaId, valor, vencimento, descricao } = body

    if (!atletaId || !valor || !vencimento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: atletaId, valor, vencimento' },
        { status: 400 }
      )
    }

    const { data: atleta } = await supabase
      .from('Atleta')
      .select('*')
      .eq('id', atletaId)
      .single()

    if (!atleta) {
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }

    let asaasCustomerId = atleta.asaasCustomerId

    if (!asaasCustomerId) {
      const cliente = await criarClienteAsaas({
        name: atleta.nome,
        cpfCnpj: atleta.cpf || '00000000000',
        phone: atleta.telefone || '',
        address: atleta.endereco || '',
        addressNumber: atleta.numero || '',
        province: atleta.bairro || '',
        postalCode: atleta.cep || '',
      })

      if (cliente.errors) {
        return NextResponse.json(
          { error: 'Erro ao criar cliente Asaas', detalhes: cliente.errors },
          { status: 400 }
        )
      }

      asaasCustomerId = cliente.id

      await supabase
        .from('Atleta')
        .update({ asaasCustomerId })
        .eq('id', atletaId)
    }

    const cobranca = await criarCobrancaPix({
      customer: asaasCustomerId,
      billingType: 'PIX',
      value: valor,
      dueDate: vencimento,
      description: descricao || 'Mensalidade',
    })

    if (cobranca.errors || !cobranca.id) {
      return NextResponse.json(
        { error: 'Erro ao criar cobrança', detalhes: cobranca },
        { status: 400 }
      )
    }

    const qrCode = await getPixQrCode(cobranca.id)

    await supabase.from('Cobranca').insert({
      id: crypto.randomUUID(),
      escolaId: 'escola-demo',
      atletaId,
      valor,
      vencimento,
      status: 'PENDENTE',
      asaasId: cobranca.id,
      pixCopiaCola: qrCode.payload || null,
      pixQrCode: qrCode.encodedImage || null,
      descricao,
    })

    return NextResponse.json({
      sucesso: true,
      pixCopiaCola: qrCode.payload,
      pixQrCode: qrCode.encodedImage,
    })

  } catch (err: any) {
    console.error('❌ Erro geral:', err.message)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}