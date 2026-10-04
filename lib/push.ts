import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase'

let configurado = false
function configurar() {
  if (configurado) return
  webpush.setVapidDetails(
    'mailto:thales@gestaofc.com.br',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  configurado = true
}

/**
 * Envia push para os celulares dos pais. Sempre filtrado pela escola.
 * Sem atletaId: manda para todos os inscritos da escola.
 * Chamar so do servidor (server action ou API autenticada).
 */
export async function enviarPush(params: {
  escolaId: string
  atletaId?: string | null
  title: string
  body?: string
  url?: string
}): Promise<{ enviados: number; total: number }> {
  configurar()
  let query = supabaseAdmin.from('PushSubscription').select('id, subscription').eq('escolaid', params.escolaId)
  if (params.atletaId) query = query.eq('atletaid', params.atletaId)

  const { data: subs } = await query
  if (!subs?.length) return { enviados: 0, total: 0 }

  const payload = JSON.stringify({
    title: params.title || 'GestãoFC',
    body: params.body || '',
    url: params.url || '/',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  })

  let enviados = 0
  await Promise.allSettled(
    subs.map(async (s: { id: string; subscription: unknown }) => {
      // a coluna e jsonb: o Supabase ja devolve objeto. Antes o codigo fazia
      // JSON.parse(objeto), que estourava e nenhum push saia.
      const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription
      try {
        await webpush.sendNotification(sub as webpush.PushSubscription, payload)
        enviados++
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await supabaseAdmin.from('PushSubscription').delete().eq('id', s.id)
        }
      }
    })
  )
  return { enviados, total: subs.length }
}
