import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buscarPixAgregado } from '@/lib/cobrancaFamilia'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { data: cobrancaRaw } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor, vencimento, status, descricao, pixCopiaCola, pixQrCode, atletaId, familiaCobrancaId')
    .eq('id', id)
    .single()

  if (!cobrancaRaw) return NextResponse.json({ error: 'nao encontrada' }, { status: 404 })

  // Mensalidade de um filho de família confirmada: essa linha nunca tem
  // PIX próprio (foi agregada com a dos irmãos) — busca o PIX real na
  // cobrança-mãe, senão a tela fica pra sempre sem QR Code.
  const pixAgregado = cobrancaRaw.familiaCobrancaId ? await buscarPixAgregado(cobrancaRaw.familiaCobrancaId) : null
  const cobranca = pixAgregado ? { ...cobrancaRaw, ...pixAgregado } : cobrancaRaw

  const { data: atleta } = await supabaseAdmin
    .from('Atleta').select('nome, escolaId').eq('id', cobrancaRaw.atletaId).single()

  const { data: escola } = atleta
    ? await supabaseAdmin.from('Escola').select('nome, logoUrl, corPrimaria, corSecundaria').eq('id', atleta.escolaId).single()
    : { data: null }

  return NextResponse.json({
    ...cobranca,
    nomeAtleta: atleta?.nome || '',
    nomeEscola: escola?.nome || '',
    logoEscola: escola?.logoUrl || null,
    corPrimaria: escola?.corPrimaria || null,
    corSecundaria: escola?.corSecundaria || null,
  })
}
