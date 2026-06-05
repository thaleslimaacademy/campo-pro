import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    // Valida o token
    const token = req.headers.get('asaas-access-token')
    if (token !== 'whsec_goER-yVis7Z1PwwXRLrq8v7IYMsbWOSPb8w6X_mrq5E') {
      console.warn('⛔ Token inválido:', token)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    console.log('📩 Webhook recebido:', JSON.stringify(body))

    const evento = body.event
    const pagamento = body.payment

    if (!evento || !pagamento?.id) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const novoStatus = STATUS_MAP[evento]
    if (!novoStatus) {
      console.log(`⏭️ Evento ignorado: ${evento}`)
      return NextResponse.json({ ignorado: true })
    }

    // ── 1. Dá baixa na cobrança ──
    const { error } = await supabase
      .from('Cobranca')
      .update({ status: novoStatus })
      .eq('asaasId', pagamento.id)

    if (error) {
      console.error('❌ Erro ao atualizar:', error)
      return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }

    console.log(`✅ ${pagamento.id} → ${novoStatus}`)

    // ── 2. Envia recibo via WhatsApp se pagamento confirmado ──
    if (novoStatus === 'PAGO') {
      try {
        // Busca dados da cobrança pelo asaasId
        const { data: cobranca } = await supabase
          .from('Cobranca')
          .select('valor, descricao, vencimento, atletaId')
          .eq('asaasId', pagamento.id)
          .single()

        if (cobranca?.atletaId) {
          // Busca nome do atleta
          const { data: atleta } = await supabase
            .from('Atleta')
            .select('nome')
            .eq('id', cobranca.atletaId)
            .single()

          // Busca WhatsApp do responsável
          const { data: responsavel } = await supabase
            .from('Responsavel')
            .select('nome, whatsapp')
            .eq('atletaId', cobranca.atletaId)
            .single()

          if (responsavel?.whatsapp) {
            // Formata data corretamente (evita Invalid Date por fuso)
            const dataVenc = cobranca.vencimento
              ? new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
              : '-'

            const msg =
              `✅ *Recibo de pagamento*\n\n` +
              `Olá ${responsavel.nome}!\n\n` +
              `Atleta: *${atleta?.nome || '-'}*\n` +
              `Descrição: ${cobranca.descricao || 'Mensalidade'}\n` +
              `Valor: R$ ${Number(cobranca.valor).toFixed(2)}\n` +
              `Vencimento: ${dataVenc}\n` +
              `Status: *PAGO* ✅\n\n` +
              `Obrigado pelo pagamento! 🎉\n` +
              `_Thales Lima Football Academy_`

            await enviarWhatsApp(responsavel.whatsapp, msg)
            console.log('📲 Recibo enviado para:', responsavel.whatsapp)
          } else {
            console.warn('⚠️ Responsável sem WhatsApp para atletaId:', cobranca.atletaId)
          }
        }
      } catch (wzErr: any) {
        // Erro de WhatsApp NÃO deve falhar o webhook
        console.error('⚠️ Erro ao enviar WhatsApp pós-pagamento:', wzErr.message)
      }
    }

    return NextResponse.json({ sucesso: true, status: novoStatus })
  } catch (err: any) {
    console.error('❌ Erro webhook:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
