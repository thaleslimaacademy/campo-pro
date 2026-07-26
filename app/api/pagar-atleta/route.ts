import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const atletaId = req.nextUrl.searchParams.get('atletaId')
  if (!atletaId) return NextResponse.json({ error: 'atletaId obrigatorio' }, { status: 400 })

  const { data: atleta } = await supabaseAdmin
    .from('Atleta').select('nome, escolaId').eq('id', atletaId).single()
  if (!atleta) return NextResponse.json({ error: 'atleta nao encontrado' }, { status: 404 })

  const { data: escola } = await supabaseAdmin
    .from('Escola').select('nome').eq('id', atleta.escolaId).single()

  const { data: cobrancas } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor, vencimento, status, descricao, pixCopiaCola, pixQrCode, competencia')
    .eq('atletaId', atletaId)
    .in('status', ['PENDENTE', 'VENCIDO'])
    .is('excluidaEm', null)
    .order('vencimento')

  return NextResponse.json({
    nomeAtleta: atleta.nome,
    nomeEscola: escola?.nome || '',
    cobrancas: cobrancas ?? [],
  })
}
