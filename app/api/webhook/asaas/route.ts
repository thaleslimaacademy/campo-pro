import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { baixarCobrancaFamilia } from '@/lib/cobrancaFamilia'

const STATUS_MAP: Record<string, string> = {
  PAYMENT_RECEIVED: 'PAGO',
  PAYMENT_CONFIRMED: 'PAGO',
  PAYMENT_OVERDUE: 'VENCIDO',
  PAYMENT_DELETED: 'CANCELADO',
  PAYMENT_REFUNDED: 'CANCELADO',
}

const brl = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dataBR = (s: string | null) => { if (!s) return '-'; return s.slice(0, 10).split('-').reverse().join('/') }

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
          const { data: fotos } = await supabaseAdmin
            .from('Foto').select('id, urlOriginal').in('id', fotoCompra.fotos)
          const links = await Promise.all((fotos || []).map(async (f: {id:string;urlOriginal:string}, i: number) => {
            const { data } = await supabaseAdmin.storage.from('fotos-originais')
              .createSignedUrl(f.urlOriginal, 60 * 60 * 24 * 7)
            return `📷 Foto ${i + 1}: ${data?.signedUrl || ''}`
          }))
          const primeiroNome = fotoCompra.compradorNome.split(' ')[0]
          const msg = [`✅ *Pagamento confirmado!*`, ``, `Olá, *${primeiroNome}*! 🎉`, ``, `Suas fotos estão prontas. Links válidos por *7 dias*:`,``, ...links, ``, `⬇️ Clique em cada link para baixar.`, ``, `_GestãoFC · gestaofc.com.br_`].join('\n')
          await enviarWhatsApp(fotoCompra.compradorTelefone, msg)
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
          const primeiroNome = pedido.compradorNome.split(' ')[0]
          const itensTexto = (pedido.itens as {nome:string;tamanho?:string;cor?:string;qtd:number;preco:number}[]).map(i =>
            `• ${i.nome}${i.tamanho ? ` (${i.tamanho})` : ''}${i.cor ? ` - ${i.cor}` : ''} × ${i.qtd} — R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`
          ).join('\n')
          const msg = [`✅ *Pedido confirmado!*`, ``, `Olá, *${primeiroNome}*! 🎉`, ``, `*Seus itens:*`, itensTexto, ``, `💰 Total: *R$ ${pedido.valor.toFixed(2).replace('.', ',')}*`, `📦 Entrega: *${pedido.tipoEntrega === 'RETIRADA' ? 'Retirada na escola' : 'Entrega no endereço'}*`, ``, `Em breve entraremos em contato! 👊`, `_GestãoFC · gestaofc.com.br_`].join('\n')
          await enviarWhatsApp(pedido.compradorTelefone, msg)
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
            await enviarWhatsApp(escola.whatsapp, `🏆 *GestãoFC — Plano Ativado!*\n\nOlá! Seu pagamento foi confirmado e o *${escola.nome}* já está ativo. 🎉\n\nAcesse: *gestaofc.com.br*\n\n_Bem-vindo(a)!_`)
          } catch (e) { console.error('Erro WhatsApp escola:', (e as Error).message) }
        }
        return
      }
    }

    // ── MENSALIDADE ──
    // .select('id') e obrigatorio: no Supabase, um update que nao casa nenhuma
    // linha retorna SUCESSO com zero linhas, nao erro. Sem isso a falha some.
    const { data: atualizadas, error } = await supabaseAdmin
      .from('Cobranca')
      .update({
        status: novoStatus,
        ...(novoStatus === 'PAGO' ? {
          pagoEm: (pagamento.paymentDate as string) || new Date().toISOString(),
          valorPago: pagamento.value as number,
        } : {}),
      })
      .eq('asaasId', pagamento.id)
      .select('id')

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
          const [{ data: atleta }, { data: responsavel }, { data: escola }] = await Promise.all([
            supabaseAdmin.from('Atleta').select('nome').eq('id', cobranca.atletaId).single(),
            supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', cobranca.atletaId).eq('principal', true).maybeSingle(),
            supabaseAdmin.from('Escola').select('nome').eq('id', cobranca.escolaId).single(),
          ])
          const escolaNome = escola?.nome?.split('—').pop()?.trim() || 'GestãoFC'

          if (responsavel?.whatsapp) {
            const primeiroNome = responsavel.nome?.split(' ')[0] || 'Responsável'
            const msg = [
              `✅ *Pagamento confirmado!*`, ``,
              `Olá, *${primeiroNome}*! 🎉`, ``,
              `👤 Atleta: *${atleta?.nome || '-'}*`,
              `📋 Referente: ${cobranca.descricao || 'Mensalidade'}`,
              `💰 Valor: *R$ ${brl(Number(cobranca.valor))}*`,
              `📅 Vencimento: ${dataBR(cobranca.vencimento)}`,
              `✅ Status: *PAGO*`, ``,
              `Obrigado pelo pagamento! 🙏`,
              `_${escolaNome} · gestaofc.com.br_`,
            ].join('\n')
            await enviarWhatsApp(responsavel.whatsapp, msg, cobranca.escolaId)
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
