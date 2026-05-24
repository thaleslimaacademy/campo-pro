import { NextRequest, NextResponse } from 'next/server'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // 🔍 DIAGNÓSTICO TEMPORÁRIO
  const key = process.env.ASAAS_API_KEY ?? 'UNDEFINED'
  console.log('🔑 KEY inicio:', key.slice(0, 25))
  console.log('🔑 Tem aspas simples?', key.startsWith("'"))
  console.log('🌍 ASAAS_URL:', process.env.ASAAS_URL)

  const { atletaId, valor, vencimento, descricao } = await req.json()

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

    console.log('Resposta Asaas cliente:', JSON.stringify(cliente))

    if (cliente.errors) {
      return NextResponse.json({ error: 'Erro ao criar cliente', detalhes: cliente.errors }, { status: 400 })
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
    description: descricao,
  })

  console.log('Resposta Asaas cobranca:', JSON.stringify(cobranca))

  if (cobranca.errors || !cobranca.id) {
    return NextResponse.json({ error: 'Erro ao criar cobrança', detalhes: cobranca }, { status: 400 })
  }

  const qrCode = await getPixQrCode(cobranca.id)

  console.log('Resposta Asaas qrCode:', JSON.stringify(qrCode))

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
}