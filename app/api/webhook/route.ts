import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = body.event
    const payment = body.payment

    if (!payment?.id) {
      return NextResponse.json({ ok: true })
    }

    // Pagamento confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      await supabaseAdmin
        .from('Cobranca')
        .update({ status: 'PAGO', updatedAt: new Date().toISOString() })
        .eq('asaasId', payment.id)
    }

    // Pagamento vencido
    if (event === 'PAYMENT_OVERDUE') {
      await supabaseAdmin
        .from('Cobranca')
        .update({ status: 'VENCIDO', updatedAt: new Date().toISOString() })
        .eq('asaasId', payment.id)
    }

    // Pagamento cancelado
    if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_RESTORED') {
      await supabaseAdmin
        .from('Cobranca')
        .update({ status: 'CANCELADO', updatedAt: new Date().toISOString() })
        .eq('asaasId', payment.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
