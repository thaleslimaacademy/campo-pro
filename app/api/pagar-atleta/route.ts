import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { gerarPixSeFaltar } from '@/lib/gerarPixSeFaltar'

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
    .select('id, valor, vencimento, status, descricao, pixCopiaCola, pixQrCode, competencia, asaasId')
    .eq('atletaId', atletaId)
    .in('status', ['PENDENTE', 'VENCIDO'])
    .is('excluidaEm', null)
    .order('vencimento')

  // Gera o PIX na hora para quem ainda nao tem — sem isso, so o mes mais
  // proximo do vencimento (D-3) teria QR Code, e o pai nao conseguiria
  // adiantar o pagamento dos meses seguintes.
  const semPix = (cobrancas ?? []).filter(c => !c.asaasId)
  if (semPix.length) {
    await Promise.all(semPix.map(c =>
      gerarPixSeFaltar(c.id, atleta.escolaId, atletaId, Number(c.valor), String(c.vencimento).slice(0, 10))
    ))
    const { data: atualizadas } = await supabaseAdmin
      .from('Cobranca')
      .select('id, valor, vencimento, status, descricao, pixCopiaCola, pixQrCode, competencia')
      .eq('atletaId', atletaId)
      .in('status', ['PENDENTE', 'VENCIDO'])
      .is('excluidaEm', null)
      .order('vencimento')
    return NextResponse.json({
      nomeAtleta: atleta.nome,
      nomeEscola: escola?.nome || '',
      cobrancas: atualizadas ?? [],
    })
  }

  return NextResponse.json({
    nomeAtleta: atleta.nome,
    nomeEscola: escola?.nome || '',
    cobrancas: cobrancas ?? [],
  })
}
