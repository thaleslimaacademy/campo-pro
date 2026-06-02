import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { data: cobranca } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor, vencimento, status, descricao, pixCopiaCola, pixQrCode, atletaId')
    .eq('id', id)
    .single()

  if (!cobranca) return NextResponse.json({ error: 'nao encontrada' }, { status: 404 })

  const { data: atleta } = await supabaseAdmin
    .from('Atleta').select('nome, escolaId').eq('id', cobranca.atletaId).single()

  const { data: escola } = atleta
    ? await supabaseAdmin.from('Escola').select('nome').eq('id', atleta.escolaId).single()
    : { data: null }

  return NextResponse.json({
    ...cobranca,
    nomeAtleta: atleta?.nome || '',
    nomeEscola: escola?.nome || '',
  })
}
