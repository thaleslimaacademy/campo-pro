import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarClienteAsaas, criarAssinatura, buscarCobrancasDaAssinatura } from '@/lib/asaas'

const VALORES: Record<string, number> = {
  BASICO: 79,
  PRO: 129,
  ELITE: 199,
}

export async function POST(req: NextRequest) {
  try {
    const { escolaId, plano, nome, email, whatsapp } = await req.json()

    const valor = VALORES[plano] ?? 129
    const hoje = new Date().toISOString().split('T')[0]

    // 1. Criar customer no Asaas
    const customer = await criarClienteAsaas({
      name: nome || 'Cliente GestaoFC',
      cpfCnpj: '',
      email: email || '',
      phone: whatsapp || '',
    })

    if (!customer.id) {
      console.error('Asaas customer error:', customer)
      return NextResponse.json({ ok: false, error: 'Erro ao criar cliente Asaas' })
    }

    // 2. Criar assinatura mensal
    const sub = await criarAssinatura({
      customer: customer.id,
      billingType: 'UNDEFINED',
      value: valor,
      nextDueDate: hoje,
      cycle: 'MONTHLY',
      description: `GestaoFC - Plano ${plano}`,
    })

    if (!sub.id) {
      console.error('Asaas subscription error:', sub)
      return NextResponse.json({ ok: false, error: 'Erro ao criar assinatura Asaas' })
    }

    // 3. Buscar primeira cobrança gerada (aguarda 1.5s)
    await new Promise(r => setTimeout(r, 1500))
    const charges = await buscarCobrancasDaAssinatura(sub.id)
    const firstCharge = charges.data?.[0]
    const paymentLink = firstCharge?.invoiceUrl

    if (!paymentLink) {
      console.error('Asaas no invoiceUrl:', charges)
      return NextResponse.json({ ok: false, error: 'Link de pagamento não gerado' })
    }

    // 4. Salvar no Supabase
    await supabaseAdmin.from('Escola').update({
      asaasId: customer.id,
      asaasSubscriptionId: sub.id,
      statusPlano: 'PENDENTE',
      planoGestaoFC: plano,
    }).eq('id', escolaId)

    return NextResponse.json({ ok: true, paymentLink })

  } catch (e) {
    console.error('Erro criar-assinatura:', e)
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
