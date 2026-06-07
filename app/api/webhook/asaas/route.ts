import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

const STATUS_MAP: Record<string, string> = {
  PAYMENT_RECEIVED: 'PAGO',
  PAYMENT_CONFIRMED: 'PAGO',
  PAYMENT_OVERDUE: 'VENCIDO',
  PAYMENT_DELETED: 'CANCELADO',
  PAYMENT_REFUNDED: 'CANCELADO',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Webhook Asaas recebido:', JSON.stringify(body))

    const evento = body.event
    const pagamento = body.payment

    if (!evento || !pagamento?.id) {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const novoStatus = STATUS_MAP[evento]
    if (!novoStatus) {
      console.log('Evento ignorado:', evento)
      return NextResponse.json({ ignorado: true })
    }

    // Baixa no Supabase
    const { error } = await supabaseAdmin
      .from('Cobranca')
      .update({ status: novoStatus })
      .eq('asaasId', pagamento.id)

    if (error) {
      console.error('Erro ao atualizar Cobranca:', error)
      return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }

    console.log('Cobranca atualizada:', pagamento.id, '->', novoStatus)

    // Envia recibo WhatsApp se pagamento confirmado
    if (novoStatus === 'PAGO') {
      try {
        const { data: cobranca } = await supabaseAdmin
          .from('Cobranca')
          .select('valor, descricao, vencimento, atletaId')
          .eq('asaasId', pagamento.id)
          .single()

        if (cobranca?.atletaId) {
          const { data: atleta } = await supabaseAdmin
            .from('Atleta').select('nome').eq('id', cobranca.atletaId).single()

          const { data: responsavel } = await supabaseAdmin
            .from('Responsavel').select('nome, whatsapp').eq('atletaId', cobranca.atletaId).single()

          if (responsavel?.whatsapp) {
            const dataVenc = cobranca.vencimento
              ? new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
              : '-'

            const msg =
              'Ola ' + (responsavel.nome?.split(' ')[0] || '') + '! Recibo de pagamento:\n\n' +
              'Atleta: *' + (atleta?.nome || '-') + '*\n' +
              'Descricao: ' + (cobranca.descricao || 'Mensalidade') + '\n' +
              'Valor: R$ ' + Number(cobranca.valor).toFixed(2) + '\n' +
              'Vencimento: ' + dataVenc + '\n' +
              'Status: *PAGO* \n\n' +
              'Obrigado pelo pagamento!\n' +
              '_Thales Lima Football Academy_'

            await enviarWhatsApp(responsavel.whatsapp, msg)
            console.log('Recibo WhatsApp enviado para:', responsavel.whatsapp)
          }
        }
      } catch (wzErr: any) {
        console.error('Erro WhatsApp pos-pagamento:', wzErr.message)
      }
    }

    return NextResponse.json({ sucesso: true, status: novoStatus })
  } catch (err: any) {
    console.error('Erro webhook:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
