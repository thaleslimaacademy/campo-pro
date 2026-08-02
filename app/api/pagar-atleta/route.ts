import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { gerarPixOuAgregarFamilia, buscarPixAgregado } from '@/lib/cobrancaFamilia'

const SELECT_COBRANCA = 'id, valor, vencimento, status, descricao, pixCopiaCola, pixQrCode, competencia, asaasId, familiaCobrancaId'

type CobrancaRow = {
  id: string; valor: number; vencimento: string; status: string; descricao: string | null
  pixCopiaCola: string | null; pixQrCode: string | null; competencia: string; asaasId: string | null
  familiaCobrancaId: string | null
}

export async function GET(req: NextRequest) {
  const atletaId = req.nextUrl.searchParams.get('atletaId')
  if (!atletaId) return NextResponse.json({ error: 'atletaId obrigatorio' }, { status: 400 })

  const { data: atleta } = await supabaseAdmin
    .from('Atleta').select('nome, escolaId').eq('id', atletaId).single()
  if (!atleta) return NextResponse.json({ error: 'atleta nao encontrado' }, { status: 404 })

  const { data: escola } = await supabaseAdmin
    .from('Escola').select('nome').eq('id', atleta.escolaId).single()

  const { data: cobrancasData } = await supabaseAdmin
    .from('Cobranca')
    .select(SELECT_COBRANCA)
    .eq('atletaId', atletaId)
    .in('status', ['PENDENTE', 'VENCIDO'])
    .is('excluidaEm', null)
    .order('vencimento')
  let cobrancas = (cobrancasData ?? []) as CobrancaRow[]

  // Gera o PIX na hora para quem ainda nao tem — sem isso, so o mes mais
  // proximo do vencimento (D-3) teria QR Code, e o pai nao conseguiria
  // adiantar o pagamento dos meses seguintes. Se o atleta estiver numa
  // familia confirmada, gerarPixOuAgregarFamilia decide sozinha e agrega
  // no PIX unico da familia em vez de gerar um PIX individual aqui.
  const semPix = cobrancas.filter((c: CobrancaRow) => !c.asaasId)
  if (semPix.length) {
    await Promise.all(semPix.map((c: CobrancaRow) =>
      gerarPixOuAgregarFamilia(c.id, atleta.escolaId, atletaId, Number(c.valor), String(c.vencimento).slice(0, 10), String(c.competencia).slice(0, 10))
    ))
    const { data: atualizadas } = await supabaseAdmin
      .from('Cobranca')
      .select(SELECT_COBRANCA)
      .eq('atletaId', atletaId)
      .in('status', ['PENDENTE', 'VENCIDO'])
      .is('excluidaEm', null)
      .order('vencimento')
    cobrancas = (atualizadas ?? []) as CobrancaRow[]
  }

  // Mensalidade de familia: a linha individual nunca tem PIX proprio (foi
  // agregada) — troca pelos campos de pagamento da cobranca-mae.
  const cobrancasResolvidas = await Promise.all(
    cobrancas.map(async (c: CobrancaRow) => {
      if (!c.familiaCobrancaId) return c
      const agregado = await buscarPixAgregado(c.familiaCobrancaId)
      return agregado ? { ...c, ...agregado } : c
    })
  )

  return NextResponse.json({
    nomeAtleta: atleta.nome,
    nomeEscola: escola?.nome || '',
    cobrancas: cobrancasResolvidas,
  })
}
