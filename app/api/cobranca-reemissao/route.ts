import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelarCobrancaAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { enviarWhatsApp } from '@/lib/whatsapp'

const JUROS = 15

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1)
  const dataOntem = ontem.toISOString().slice(0, 10)
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1)
  const dataAmanha = amanha.toISOString().slice(0, 10)
  const { data: cobPendentes } = await supabaseAdmin.from('Cobranca')
    .select('id, valor, asaasId, atletaId, escolaId, descricao').eq('status', 'PENDENTE').eq('vencimento', dataOntem)
  if (!cobPendentes || cobPendentes.length === 0) return NextResponse.json({ ok: true, reemitidas: 0 })
  let reemitidas = 0, erros = 0
  for (const cob of cobPendentes) {
    try {
      const apiKey = await getAsaasKey(cob.escolaId)
      if (cob.asaasId) await cancelarCobrancaAsaas(apiKey, cob.asaasId)
      await supabaseAdmin.from('Cobranca').update({ status: 'CANCELADO' }).eq('id', cob.id)
      const { data: atleta } = await supabaseAdmin.from('Atleta').select('nome, asaasCustomerId').eq('id', cob.atletaId).single()
      if (!atleta?.asaasCustomerId) { erros++; continue }
      const novoValor = Number(cob.valor) + JUROS
      const novaCobranca = await criarCobrancaPix(apiKey, { customer: atleta.asaasCustomerId, billingType: 'PIX', value: novoValor, dueDate: dataAmanha, description: 'Mensalidade + juros por atraso' })
      if (novaCobranca.errors) { erros++; continue }
      const qrCode = await getPixQrCode(apiKey, novaCobranca.id)
      const novoId = crypto.randomUUID()
      await supabaseAdmin.from('Cobranca').insert({
        id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId, valor: novoValor,
        vencimento: dataAmanha, status: 'PENDENTE', asaasId: novaCobranca.id,
        pixCopiaCola: qrCode.payload || null, pixQrCode: qrCode.encodedImage || null, descricao: 'Mensalidade + juros por atraso',
      })
      const { data: resps } = await supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', cob.atletaId).eq('principal', true).limit(1)
      const resp = resps?.[0]
      if (resp?.whatsapp) {
        const nome = resp.nome.split(' ')[0]
        const dataFmt = new Date(dataAmanha + 'T12:00:00').toLocaleDateString('pt-BR')
        const link = 'https://gestaofc.com.br/pagar/' + novoId
        const msg = ['⚠️ *AVISO — MENSALIDADE NÃO PAGA*', '', `Olá, *${nome}*!`, '', `A mensalidade de *${atleta.nome}* venceu ontem e *não foi paga no prazo*.`, '', `💰 Valor original: *R$ ${Number(cob.valor).toFixed(2)}*`, `💰 Novo valor: *R$ ${novoValor.toFixed(2)}*`, `📅 Novo vencimento: *${dataFmt}*`, '', '⚡ Pague agora:', link, '', '_Thales Lima Football Academy_'].join('\n')
        await enviarWhatsApp(resp.whatsapp, msg)
      }
      reemitidas++
      await new Promise(r => setTimeout(r, 400))
    } catch (err) { console.error('Erro reemissão', cob.id, err); erros++ }
  }
  return NextResponse.json({ ok: true, reemitidas, erros })
}
