import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabaseAdmin } from '@/lib/supabase'
import { msgPagamentoConfirmado, msgFotosProntas, msgPedidoConfirmado, msgPlanoAtivado } from '@/lib/whatsapp-templates'
import { baixarCobrancaFamilia } from '@/lib/cobrancaFamilia'

const STATUS_MAP: Record<string, string> = {
  PAYMENT_RECEIVED: 'PAGO',
  PAYMENT_CONFIRMED: 'PAGO',
  PAYMENT_OVERDUE: 'VENCIDO',
  PAYMENT_DELETED: 'CANCELADO',
  PAYMENT_REFUNDED: 'CANCELADO',
}

/**
 * Quando uma assinatura recorrente (debito automatico no cartao) gera a
 * cobranca do mes sozinha, a Asaas manda PAYMENT_CREATED antes de cobrar.
 * Criamos a linha em Cobranca aqui — sem isso, o PAYMENT_CONFIRMED que vem
 * logo em seguida nao teria nenhuma linha pra atualizar (o update por
 * asaasId simplesmente nao acharia nada e sairia em silencio).
 */
async function processarPagamentoCriado(pagamento: Record<string, unknown>) {
  const subscriptionId = pagamento.subscription as string | undefined
  if (!subscriptionId) return

  const { data: atleta } = await supabaseAdmin.from('Atleta')
    .select('id, nome, escolaId').eq('asaasSubscriptionId', subscriptionId).maybeSingle()
  if (!atleta) return // nao e uma assinatura de mensalidade nossa (pode ser de outro fluxo)

  const { data: jaExiste } = await supabaseAdmin.from('Cobranca')
    .select('id').eq('asaasId', pagamento.id as string).maybeSingle()
  if (jaExiste) return // idempotencia — webhook pode reenviar o mesmo evento

  const vencimento = String(pagamento.dueDate || '').slice(0, 10)
  const { error } = await supabaseAdmin.from('Cobranca').insert({
    id: crypto.randomUUID(), escolaId: atleta.escolaId, atletaId: atleta.id,
    atletaNome: atleta.nome, valor: pagamento.value as number, vencimento,
    competencia: vencimento.slice(0, 7) + '-01',
    status: 'PENDENTE', tipo: 'CARTAO_RECORRENTE', descricao: 'Mensalidade — débito automático',
    asaasId: pagamento.id as string,
  })
  if (error) console.error('Erro ao criar Cobranca da assinatura:', error.message)
}

// Processa o webhook em background — sem bloquear a resposta
async function processar(body: Record<string, unknown>) {
  try {
    const evento = body.event as string
    const pagamento = body.payment as Record<string, unknown>
    if (!evento || !pagamento?.id) return

    if (evento === 'PAYMENT_CREATED') {
      await processarPagamentoCriado(pagamento)
      return
    }

    const novoStatus = STATUS_MAP[evento]
    if (!novoStatus) return

    // ── COMPRA DE FOTO ──
    const { data: fotoCompra } = await supabaseAdmin
      .from('FotoCompra')
      .select('id, fotos, compradorNome, compradorTelefone, linkEnviado')
      .eq('asaasId', pagamento.id)
      .maybeSingle()

    if (fotoCompra) {
      await supabaseAdmin.from('FotoCompra')
        .update({ status: novoStatus, ...(novoStatus === 'PAGO' ? { pagoEm: new Date().toISOString() } : {}) })
        .eq('id', fotoCompra.id)
      if (novoStatus === 'PAGO' && !fotoCompra.linkEnviado) {
        try {
          // O link aponta pra pagina /fotos-compra/[id], que gera as signed
          // URLs na hora (o template Meta nao aguenta lista de links de
          // tamanho variavel — ver lib/whatsapp-templates.ts)
          const linkDownload = `https://gestaofc.com.br/fotos-compra/${fotoCompra.id}`
          await msgFotosProntas({
            telefone: fotoCompra.compradorTelefone,
            nomeComprador: fotoCompra.compradorNome,
            linkDownload,
          })
          await supabaseAdmin.from('FotoCompra').update({ linkEnviado: true }).eq('id', fotoCompra.id)
        } catch (e) { console.error('Erro WhatsApp foto:', (e as Error).message) }
      }
      return
    }

    // ── PEDIDO DA LOJA ──
    const { data: pedido } = await supabaseAdmin
      .from('Pedido')
      .select('id, compradorNome, compradorTelefone, itens, valor, tipoEntrega')
      .eq('asaasId', pagamento.id)
      .maybeSingle()

    if (pedido) {
      await supabaseAdmin.from('Pedido')
        .update({ status: novoStatus, ...(novoStatus === 'PAGO' ? { pagoEm: new Date().toISOString() } : {}) })
        .eq('id', pedido.id)
      if (novoStatus === 'PAGO') {
        try {
          await msgPedidoConfirmado({
            telefone: pedido.compradorTelefone,
            nomeComprador: pedido.compradorNome,
            valor: pedido.valor,
            tipoEntrega: pedido.tipoEntrega,
          })
        } catch (e) { console.error('Erro WhatsApp pedido:', (e as Error).message) }
      }
      return
    }

    // ── ASSINATURA GESTAOFC ──
    if ((pagamento.subscription as string) && novoStatus === 'PAGO') {
      const { data: escola } = await supabaseAdmin
        .from('Escola').select('id, nome, ativo, statusPlano, whatsapp, planoGestaoFC')
        .eq('asaasSubscriptionId', pagamento.subscription).maybeSingle()
      if (escola) {
        const maxMod = escola.planoGestaoFC === 'ELITE' ? 99 : escola.planoGestaoFC === 'PRO' ? 3 : 1
        await supabaseAdmin.from('Escola').update({ ativo: true, statusPlano: 'ATIVO', maxModalidades: maxMod }).eq('id', escola.id)
        if (escola.whatsapp) {
          try {
            await msgPlanoAtivado({ telefone: escola.whatsapp, nomeEscola: escola.nome })
          } catch (e) { console.error('Erro WhatsApp escola:', (e as Error).message) }
        }
        return
      }
    }

    // ── MENSALIDADE ──
    // .select('id') e obrigatorio: no Supabase, um update que nao casa nenhuma
    // linha retorna SUCESSO com zero linhas, nao erro. Sem isso a falha some.
    //
    // 11/08/2026 — .neq('status','PAGO') quando o evento NAO e de pagamento.
    // PAYMENT_OVERDUE e PAYMENT_DELETED estavam rebaixando cobranca ja PAGA
    // de volta pra VENCIDO/CANCELADO. A regua entao enxergava como em aberto
    // e cobrava de novo quem ja tinha pago. Uma cobranca paga nunca volta
    // atras por evento de vencimento ou cancelamento.
    const query = supabaseAdmin
      .from('Cobranca')
      .update({
        status: novoStatus,
        ...(novoStatus === 'PAGO' ? {
          pagoEm: (pagamento.paymentDate as string) || new Date().toISOString(),
          valorPago: pagamento.value as number,
        } : {}),
      })
      .eq('asaasId', pagamento.id)

    if (novoStatus !== 'PAGO') query.neq('status', 'PAGO')

    const { data: atualizadas, error } = await query.select('id')

    if (error) { console.error('Erro ao atualizar Cobranca:', error); return }
    if (!atualizadas?.length) {
      console.warn('Webhook sem cobranca correspondente:', pagamento.id, evento)
      return
    }

    if (novoStatus === 'PAGO') {
      try {
        const { data: cobranca } = await supabaseAdmin
          .from('Cobranca').select('id, valor, descricao, vencimento, atletaId, escolaId, tipo')
          .eq('asaasId', pagamento.id).single()

        // Cobrança agregada de família: propaga a baixa pra cada ficha
        // individual dos filhos (elas nunca tiveram PIX próprio).
        if (cobranca?.tipo === 'FAMILIA') {
          await baixarCobrancaFamilia(cobranca.id)
        }

        if (cobranca?.atletaId) {
          const [{ data: atleta }, { data: responsavel }] = await Promise.all([
            supabaseAdmin.from('Atleta').select('nome').eq('id', cobranca.atletaId).single(),
            supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', cobranca.atletaId).eq('principal', true).maybeSingle(),
          ])

          if (responsavel?.whatsapp) {
            // Template aprovado da Meta (pagamento_confirmado) via
            // whatsapp-templates, que ja decide Meta vs Evolution sozinho.
            // Texto livre nao serve aqui: fora da janela de 24h a Meta recusa.
            await msgPagamentoConfirmado({
              telefone: responsavel.whatsapp,
              nomeResp: responsavel.nome?.split(' ')[0] || 'Responsável',
              nomeAtleta: atleta?.nome || '-',
              // valor efetivamente pago (com multa/juros se houve atraso),
              // com o valor de face como fallback
              valor: Number(pagamento.value ?? cobranca.valor),
              referencia: cobranca.descricao || 'Mensalidade',
              escolaId: cobranca.escolaId,
            })
          }
        }
      } catch (e) { console.error('Erro WhatsApp confirmação:', (e as Error).message) }
    }
  } catch (err) {
    console.error('Erro processar webhook:', (err as Error).message)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Webhook Asaas recebido:', body.event, body.payment?.id)

    // Responde 200 rapido, mas o waitUntil garante que o processamento
    // termine. Sem ele a instancia serverless congela ao enviar a resposta
    // e o processar() morre no meio — era a causa da baixa nunca acontecer.
    waitUntil(processar(body).catch(err => console.error('Erro background:', err)))
    return NextResponse.json({ recebido: true })

  } catch (err: unknown) {
    console.error('Erro webhook parse:', (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
