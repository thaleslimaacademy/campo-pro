import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const STATUS_MAP: Record<string, string> = {
  PAYMENT_RECEIVED: 'PAGO',
  PAYMENT_CONFIRMED: 'PAGO',
  PAYMENT_OVERDUE: 'VENCIDO',
  PAYMENT_DELETED: 'CANCELADO',
  PAYMENT_REFUNDED: 'CANCELADO',
}

export async function POST(req: NextRequest) {
  try {
    // Valida o token
    const token = req.headers.get('asaas-access-token')
    if (token !== 'whsec_goER-yVis7Z1PwwXRLrq8v7IYMsbWOSPb8w6X_mrq5E') {
      console.warn('⛔ Token inválido:', token)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    console.log('📩 Webhook recebido:', JSON.stringify(body))

    const evento = body.event
    const pagamento = body.payment

    if (!evento || !pagamento?.id) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const novoStatus = STATUS_MAP[evento]

    if (!novoStatus) {
      console.log(`⏭️ Evento ignorado: ${evento}`)
      return NextResponse.json({ ignorado: true })
    }

    const { error } = await supabase
      .from('Cobranca')
      .update({ status: novoStatus })
      .eq('asaasId', pagamento.id)

    if (error) {
      console.error('❌ Erro ao atualizar:', error)
      return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }

    console.log(`✅ ${pagamento.id} → ${novoStatus}`)
    return NextResponse.json({ sucesso: true, status: novoStatus })

  } catch (err: any) {
    console.error('❌ Erro webhook:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}