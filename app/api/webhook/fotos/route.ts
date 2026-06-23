import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, payment } = body

    if (!payment?.externalReference) {
      return NextResponse.json({ ok: true })
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      await supabaseAdmin
        .from('Cobranca')
        .update({ status: 'PAGO', pagoEm: new Date().toISOString() })
        .eq('asaasId', payment.id)
    }

    if (event === 'PAYMENT_OVERDUE') {
      await supabaseAdmin
        .from('Cobranca')
        .update({ status: 'VENCIDO' })
        .eq('asaasId', payment.id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
