import { NextRequest, NextResponse } from 'next/server'
import { sessaoFinanceiroApi } from '@/lib/apiAuth'
import { enviarPush } from '@/lib/push'

// Antes era publica e sem login: qualquer pessoa mandava notificacao com
// qualquer texto para todos os pais de uma escola. Agora so admin/diretor,
// e sempre na escola da propria sessao.
export async function POST(req: NextRequest) {
  const sessao = await sessaoFinanceiroApi()
  if (sessao instanceof NextResponse) return sessao

  const { atletaId, title, body, url } = await req.json()
  if (!title) return NextResponse.json({ error: 'title obrigatorio' }, { status: 400 })

  const r = await enviarPush({ escolaId: sessao.escolaId, atletaId, title, body, url })
  return NextResponse.json({ ok: true, ...r })
}
