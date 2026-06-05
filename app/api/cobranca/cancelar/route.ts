import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cancelarCobrancaAsaas } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  try {
    const { cobrancaId } = await req.json()
    if (!cobrancaId) {
      return NextResponse.json({ error: 'cobrancaId obrigatorio' }, { status: 400 })
    }

    // Busca asaasId no Supabase
    const { data: cobranca, error: errBusca } = await supabase
      .from('Cobranca')
      .select('id, asaasId, status')
      .eq('id', cobrancaId)
      .single()

    if (errBusca || !cobranca) {
      return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 })
    }

    // Cancela no Asaas (se tiver asaasId e nao estiver ja cancelado/pago)
    if (cobranca.asaasId && cobranca.status !== 'PAGO' && cobranca.status !== 'CANCELADO') {
      const resultado = await cancelarCobrancaAsaas(cobranca.asaasId)
      console.log('Asaas cancelamento:', resultado)
    }

    // Atualiza status no Supabase para CANCELADO
    const { error: errUpdate } = await supabase
      .from('Cobranca')
      .update({ status: 'CANCELADO' })
      .eq('id', cobrancaId)

    if (errUpdate) {
      return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    }

    console.log('✅ Cobranca cancelada:', cobrancaId)
    return NextResponse.json({ sucesso: true })
  } catch (err: any) {
    console.error('Erro ao cancelar cobranca:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
