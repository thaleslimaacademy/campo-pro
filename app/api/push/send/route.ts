import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:thales@gestaofc.com.br',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { atletaId, escolaId, title, body, url } = await req.json()

  // Busca subscriptions do atleta OU de toda a escola
  let query = supabaseAdmin.from('PushSubscription').select('subscription')
  if (atletaId) query = query.eq('atletaid', atletaId)
  else if (escolaId) query = query.eq('escolaid', escolaId)
  else return NextResponse.json({ error: 'atletaId ou escolaId obrigatório' }, { status: 400 })

  const { data: subs } = await query
  if (!subs?.length) return NextResponse.json({ ok: true, enviados: 0 })

  const payload = JSON.stringify({
    title: title || 'GestãoFC',
    body: body || '',
    url: url || '/',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  })

  let enviados = 0
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(JSON.parse(s.subscription), payload)
        enviados++
      } catch (e: unknown) {
        // Remove subscription inválida
        if ((e as { statusCode?: number }).statusCode === 410) {
          await supabaseAdmin.from('PushSubscription').delete().eq('subscription', s.subscription)
        }
      }
    })
  )

  return NextResponse.json({ ok: true, enviados })
}
