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

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const dataBR = (s: string | null) => {
  if (!s) return '-'
  return s.slice(0, 10).split('-').reverse().join('/')
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
      .update({ status: novoStatus, ...(novoStatus === 'PAGO' ? { pagoEm: new Date().toISOString() } : {}) })
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
            .from('Atleta')
            .select('nome')
            .eq('id', cobranca.atletaId)
            .single()

          // ✅ FIX: filtra por principal: true para pegar o responsável correto
          const { data: responsavel } = await supabaseAdmin
            .from('Responsavel')
            .select('nome, whatsapp')
            .eq('atletaId', cobranca.atletaId)
            .eq('principal', true)
            .maybeSingle()

          if (responsavel?.whatsapp) {
            const primeiroNome = responsavel.nome?.split(' ')[0] || 'Responsável'
            // ✅ FIX: dataBR usa slice(0,10) — sem concatenar horário duplicado
            const dataVenc = dataBR(cobranca.vencimento)
            const valorFmt = brl(Number(cobranca.valor))

            const msg = [
              `🏆 *THALES LIMA FOOTBALL ACADEMY*`,
              ``,
              `Olá, *${primeiroNome}*! ✅`,
              ``,
              `━━━━━━━━━━━━━━━━━━━━`,
              `      *RECIBO DE PAGAMENTO*`,
              `━━━━━━━━━━━━━━━━━━━━`,
              ``,
              `👤 Atleta: *${atleta?.nome || '-'}*`,
              `📋 Referente: ${cobranca.descricao || 'Mensalidade'}`,
              `💰 Valor: *R$ ${valorFmt}*`,
              `📅 Vencimento: ${dataVenc}`,
              `✅ Status: *PAGO*`,
              ``,
              `━━━━━━━━━━━━━━━━━━━━`,
              ``,
              `Obrigado pelo pagamento! 🙏`,
              `_Thales Lima Football Academy_`,
              `_gestaofc.com.br_`,
            ].join('\n')

            await enviarWhatsApp(responsavel.whatsapp, msg)
            console.log('Recibo WhatsApp enviado para:', responsavel.whatsapp)
          }
        }
      } catch (wzErr: unknown) {
        console.error('Erro WhatsApp pos-pagamento:', (wzErr as Error).message)
      }
    }

    return NextResponse.json({ sucesso: true, status: novoStatus })
  } catch (err: unknown) {
    console.error('Erro webhook:', (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}