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

const brl = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dataBR = (s: string | null) => { if (!s) return '-'; return s.slice(0, 10).split('-').reverse().join('/') }

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
    if (!novoStatus) return NextResponse.json({ ignorado: true })

    // ── VERIFICA SE É COMPRA DE FOTO ──────────────────────
    const { data: fotoCompra } = await supabaseAdmin
      .from('FotoCompra')
      .select('id, fotos, compradorNome, compradorTelefone, linkEnviado')
      .eq('asaasId', pagamento.id)
      .maybeSingle()

    if (fotoCompra) {
      // Atualiza status da compra de foto
      await supabaseAdmin.from('FotoCompra')
        .update({ status: novoStatus, ...(novoStatus === 'PAGO' ? { pagoEm: new Date().toISOString() } : {}) })
        .eq('id', fotoCompra.id)

      console.log('FotoCompra atualizada:', fotoCompra.id, '->', novoStatus)

      // Envia fotos se PAGO e ainda não enviou
      if (novoStatus === 'PAGO' && !fotoCompra.linkEnviado) {
        try {
          const { data: fotos } = await supabaseAdmin
            .from('Foto').select('id, urlOriginal').in('id', fotoCompra.fotos)

          const links = await Promise.all((fotos || []).map(async (f, i) => {
            const { data } = await supabaseAdmin.storage
              .from('fotos-originais')
              .createSignedUrl(f.urlOriginal, 60 * 60 * 24 * 7)
            return `📷 Foto ${i + 1}: ${data?.signedUrl || ''}`
          }))

          const primeiroNome = fotoCompra.compradorNome.split(' ')[0]
          const msg = [
            `✅ *Pagamento confirmado!*`,
            ``,
            `Olá, *${primeiroNome}*! 🎉`,
            ``,
            `Suas fotos estão prontas. Links válidos por *7 dias*:`,
            ``,
            ...links,
            ``,
            `⬇️ Clique em cada link para baixar a foto original.`,
            ``,
            `_Gestão FC · gestaofc.com.br_`,
          ].join('\n')

          await enviarWhatsApp(fotoCompra.compradorTelefone, msg)
          await supabaseAdmin.from('FotoCompra').update({ linkEnviado: true }).eq('id', fotoCompra.id)
          console.log('Fotos enviadas via WhatsApp para:', fotoCompra.compradorTelefone)
        } catch (e) {
          console.error('Erro ao enviar fotos WhatsApp:', (e as Error).message)
        }
      }

      return NextResponse.json({ sucesso: true, tipo: 'foto', status: novoStatus })
    }

    // ── MENSALIDADE NORMAL ────────────────────────────────
    const { error } = await supabaseAdmin
      .from('Cobranca')
      .update({ status: novoStatus, ...(novoStatus === 'PAGO' ? { pagoEm: new Date().toISOString() } : {}) })
      .eq('asaasId', pagamento.id)

    if (error) {
      console.error('Erro ao atualizar Cobranca:', error)
      return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }

    console.log('Cobranca atualizada:', pagamento.id, '->', novoStatus)

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
            .from('Responsavel').select('nome, whatsapp')
            .eq('atletaId', cobranca.atletaId).eq('principal', true).maybeSingle()

          if (responsavel?.whatsapp) {
            const primeiroNome = responsavel.nome?.split(' ')[0] || 'Responsável'
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
              `💰 Valor: *R$ ${brl(Number(cobranca.valor))}*`,
              `📅 Vencimento: ${dataBR(cobranca.vencimento)}`,
              `✅ Status: *PAGO*`,
              ``,
              `━━━━━━━━━━━━━━━━━━━━`,
              ``,
              `Obrigado pelo pagamento! 🙏`,
              `_Thales Lima Football Academy_`,
              `_gestaofc.com.br_`,
            ].join('\n')

            await enviarWhatsApp(responsavel.whatsapp, msg)
          }
        }
      } catch (wzErr: unknown) {
        console.error('Erro WhatsApp:', (wzErr as Error).message)
      }
    }

    return NextResponse.json({ sucesso: true, tipo: 'mensalidade', status: novoStatus })
  } catch (err: unknown) {
    console.error('Erro webhook:', (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}