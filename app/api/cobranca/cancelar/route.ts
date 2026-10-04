import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelarCobrancaAsaas } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { sessaoFinanceiroApi } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  try {
    // Antes esta rota nao tinha NENHUMA checagem: qualquer pessoa na internet
    // cancelava cobranca das duas escolas mandando um cobrancaId.
    const sessao = await sessaoFinanceiroApi()
    if (sessao instanceof NextResponse) return sessao
    const { cobrancaId } = await req.json()
    if (!cobrancaId) return NextResponse.json({ error: 'cobrancaId obrigatorio' }, { status: 400 })
    const { data: cobranca, error: errBusca } = await supabaseAdmin.from('Cobranca')
      .select('id, asaasId, status, escolaId').eq('id', cobrancaId).eq('escolaId', sessao.escolaId).maybeSingle()
    if (errBusca || !cobranca) return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 })
    if (cobranca.asaasId && cobranca.status !== 'PAGO' && cobranca.status !== 'CANCELADO') {
      const apiKey = await getAsaasKey(cobranca.escolaId)
      await cancelarCobrancaAsaas(apiKey, cobranca.asaasId)
    }
    const { error: errUpdate } = await supabaseAdmin.from('Cobranca').update({ status: 'CANCELADO' }).eq('id', cobrancaId).eq('escolaId', sessao.escolaId)
    if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    return NextResponse.json({ sucesso: true })
  } catch (err: any) { console.error('Erro ao cancelar cobranca:', err.message); return NextResponse.json({ error: err.message }, { status: 500 }) }
}
