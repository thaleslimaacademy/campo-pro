import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarPush } from '@/lib/push'

/**
 * Inscreve (POST) ou remove (DELETE) um celular nos avisos da Area dos Pais.
 * Identificacao pelo token da Area dos Pais (o mesmo do link que a familia recebe):
 * nunca confia em atletaId/escolaId vindos do navegador.
 * Um celular inscrito via um atleta recebe tambem os avisos dos irmaos (mesma familia).
 */
async function atletasDoToken(token: string) {
  if (!token || token.length < 8) return null
  const { data: atleta } = await supabaseAdmin.from('Atleta')
    .select('id, escolaId, familiaId, nome').eq('tokenPais', token).maybeSingle()
  if (!atleta) return null
  let ids = [atleta.id as string]
  if (atleta.familiaId) {
    const { data: irmaos } = await supabaseAdmin.from('Atleta').select('id')
      .eq('familiaId', atleta.familiaId).eq('escolaId', atleta.escolaId).eq('ativo', true)
    ids = [...new Set([...ids, ...((irmaos ?? []) as { id: string }[]).map(i => i.id)])]
  }
  return { escolaId: atleta.escolaId as string, ids, nome: String(atleta.nome || '').split(' ')[0] }
}

export async function POST(req: NextRequest) {
  try {
    const { token, subscription } = await req.json()
    const sub = subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth || !/^https:\/\//.test(sub.endpoint)) {
      return NextResponse.json({ error: 'Inscricao invalida' }, { status: 400 })
    }
    const alvo = await atletasDoToken(String(token || ''))
    if (!alvo) return NextResponse.json({ error: 'Link invalido' }, { status: 404 })

    const ua = (req.headers.get('user-agent') || '').slice(0, 200)
    const linhas = alvo.ids.map(atletaid => ({
      atletaid, escolaid: alvo.escolaId, endpoint: sub.endpoint,
      subscription: { endpoint: sub.endpoint, keys: sub.keys }, userAgent: ua,
    }))
    const { error } = await supabaseAdmin.from('PushSubscription')
      .upsert(linhas, { onConflict: 'atletaid,endpoint' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // aviso de teste so para este celular
    await enviarPush({
      escolaId: alvo.escolaId, atletaIds: alvo.ids, somenteEndpoint: sub.endpoint,
      title: 'Avisos ativados ✅',
      body: `Você vai receber aqui os avisos da escolinha sobre ${alvo.nome}.`,
    }).catch(() => null)

    return NextResponse.json({ ok: true, atletas: alvo.ids.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { token, endpoint } = await req.json()
    const alvo = await atletasDoToken(String(token || ''))
    if (!alvo || !endpoint) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    await supabaseAdmin.from('PushSubscription').delete().in('atletaid', alvo.ids).eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
