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

type Linha = { id: string; atletaid: string; endpoint: string | null; subscription: unknown }

function parseSub(s: unknown): webpush.PushSubscription | null {
  try {
    // a coluna e jsonb; versoes antigas gravavam o objeto como string
    const v = typeof s === 'string' ? JSON.parse(s) : s
    return v && typeof v === 'object' && 'endpoint' in (v as object) ? (v as webpush.PushSubscription) : null
  } catch {
    return null
  }
}

/**
 * Envia push para os celulares dos pais. Sempre filtrado pela escola.
 * - atletaIds vazio/ausente: todos os inscritos da escola.
 * - url ausente: cada celular abre a Area dos Pais do proprio atleta.
 * Um mesmo celular inscrito em 2 irmaos recebe so 1 aviso.
 * Chamar so do servidor (server action ou API autenticada).
 */
export async function enviarPush(params: {
  escolaId: string
  atletaId?: string | null
  atletaIds?: string[]
  title: string
  body?: string
  url?: string
  somenteEndpoint?: string
}): Promise<{ enviados: number; celulares: number; familias: number }> {
  configurar()
  let query = supabaseAdmin.from('PushSubscription').select('id, atletaid, endpoint, subscription').eq('escolaid', params.escolaId)
  const ids = params.atletaIds ?? (params.atletaId ? [params.atletaId] : null)
  if (ids) {
    if (!ids.length) return { enviados: 0, celulares: 0, familias: 0 }
    query = query.in('atletaid', ids)
  }
  if (params.somenteEndpoint) query = query.eq('endpoint', params.somenteEndpoint)

  const { data } = await query
  const linhas = (data ?? []) as Linha[]
  if (!linhas.length) return { enviados: 0, celulares: 0, familias: 0 }

  // token da Area dos Pais de cada atleta (para o clique abrir a pagina certa)
  const tokens: Record<string, string> = {}
  if (!params.url) {
    const { data: ats } = await supabaseAdmin.from('Atleta').select('id, tokenPais')
      .in('id', [...new Set(linhas.map(l => l.atletaid))])
    for (const a of (ats ?? []) as { id: string; tokenPais: string | null }[]) if (a.tokenPais) tokens[a.id] = a.tokenPais
  }

  // um envio por celular
  const porCelular = new Map<string, Linha>()
  for (const l of linhas) {
    const sub = parseSub(l.subscription)
    const chave = l.endpoint || sub?.endpoint || l.id
    if (!porCelular.has(chave)) porCelular.set(chave, l)
  }

  let enviados = 0
  await Promise.allSettled(
    [...porCelular.values()].map(async (l) => {
      const sub = parseSub(l.subscription)
      if (!sub) return
      const url = params.url || (tokens[l.atletaid] ? `/pais/${tokens[l.atletaid]}` : '/')
      const payload = JSON.stringify({
        title: params.title || 'GestãoFC',
        body: params.body || '',
        url,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
      try {
        await webpush.sendNotification(sub, payload, { TTL: 60 * 60 * 24 })
        enviados++
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          // celular desinstalou o app ou bloqueou: remove de todos os atletas
          const ep = l.endpoint || sub.endpoint
          await supabaseAdmin.from('PushSubscription').delete().eq('endpoint', ep)
        }
      }
    })
  )
  return { enviados, celulares: porCelular.size, familias: new Set(linhas.map(l => l.atletaid)).size }
}

/** Quantos atletas/celulares da escola estao com aviso ativo. */
export async function resumoPush(escolaId: string, atletaIds?: string[]) {
  let q = supabaseAdmin.from('PushSubscription').select('atletaid, endpoint').eq('escolaid', escolaId)
  if (atletaIds) q = q.in('atletaid', atletaIds.length ? atletaIds : ['-'])
  const { data } = await q
  const linhas = (data ?? []) as { atletaid: string; endpoint: string | null }[]
  return {
    atletasComAviso: new Set(linhas.map(l => l.atletaid)).size,
    celulares: new Set(linhas.map(l => l.endpoint)).size,
  }
}
