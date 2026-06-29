import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { subscription, atletaId, escolaId } = await req.json()
  if (!subscription || !atletaId || !escolaId)
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

  await supabaseAdmin.from('PushSubscription').upsert({
    id: crypto.randomUUID(),
    atletaid: atletaId,
    escolaid: escolaId,
    subscription: JSON.stringify(subscription),
  }, { onConflict: 'atletaid' })

  return NextResponse.json({ ok: true })
}
