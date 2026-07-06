import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelarCobrancaAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1)
  const dataOntem = ontem.toISOString().slice(0, 10)
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1)
  const dataAmanha = amanha.toISOString().slice(0, 10)

  // Busca cobranças que venceram ontem e ainda estão PENDENTE
  const { data: cobPendentes } = await supabaseAdmin.from('Cobranca')
    .select('id, valor, asaasId, atletaId, escolaId, descricao')
    .eq('status', 'PENDENTE')
    .eq('vencimento', dataOntem)

  if (!cobPendentes?.length) return NextResponse.json({ ok: true, reemitidas: 0 })

  // Marca todas como VENCIDO antes de reemitir
  await supabaseAdmin.from('Cobranca')
    .update({ status: 'VENCIDO' })
    .in('id', cobPendentes.map(c => c.id))

  let reemitidas = 0, erros = 0

  for (const cob of cobPendentes) {
    try {
      const apiKey = await getAsaasKey(cob.escolaId)

      // P3: busca juros e multa configurados pela escola
      const { data: escolaConfig } = await supabaseAdmin.from('Escola')
        .select('multaAtraso, jurosAoMes, nome, evolutionInstance')
        .eq('id', cob.escolaId).single()
      
      const multaFixa = Number(escolaConfig?.multaAtraso || 15)    // R$ fixo de multa
      const jurosPct  = Number(escolaConfig?.jurosAoMes || 1)      // % ao mês
      const escolaNome = escolaConfig?.nome?.split('—').pop()?.trim() || 'GestãoFC'

      const valorBase = Number(cob.valor)
      const valorJuros = valorBase * (jurosPct / 100)
      const novoValor = valorBase + multaFixa + valorJuros

      const { data: atleta } = await supabaseAdmin.from('Atleta')
        .select('nome, asaasCustomerId').eq('id', cob.atletaId).single()

      const novoId = crypto.randomUUID()

      if (atleta?.asaasCustomerId && apiKey) {
        // Cancela no Asaas e cria nova cobrança
        if (cob.asaasId) await cancelarCobrancaAsaas(apiKey, cob.asaasId)

        const novaCobranca = await criarCobrancaPix(apiKey, {
          customer: atleta.asaasCustomerId, billingType: 'PIX',
          value: novoValor, dueDate: dataAmanha,
          description: `Mensalidade + multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%`,
        })
        if (novaCobranca.errors) { erros++; continue }

        const qrCode = await getPixQrCode(apiKey, novaCobranca.id)
        await supabaseAdmin.from('Cobranca').insert({
          id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId,
          atletaNome: atleta.nome, valor: novoValor, vencimento: dataAmanha,
          status: 'PENDENTE', asaasId: novaCobranca.id,
          pixCopiaCola: qrCode.payload || null,
          pixQrCode: qrCode.encodedImage || null,
          descricao: `Mensalidade + multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%`,
        })
      } else {
        // Sem Asaas: cobrança manual com juros
        await supabaseAdmin.from('Cobranca').insert({
          id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId,
          atletaNome: atleta?.nome || null, valor: novoValor, vencimento: dataAmanha,
          status: 'PENDENTE', tipo: 'MANUAL',
          descricao: `Mensalidade + multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%`,
        })
      }

      // WhatsApp de cobrança em atraso
      const { data: resps } = await supabaseAdmin.from('Responsavel')
        .select('nome, whatsapp').eq('atletaId', cob.atletaId).eq('principal', true).limit(1)
      const resp = resps?.[0]
      if (resp?.whatsapp && atleta) {
        const nomeResp = resp.nome.split(' ')[0]
        const dataFmt = new Date(dataAmanha + 'T12:00:00').toLocaleDateString('pt-BR')
        const mensagem = `Ola ${nomeResp}! ⚠️\n\nA mensalidade de *${atleta.nome}* está em atraso.\n\nFoi gerada nova cobrança com acréscimo:\n💰 *R$ ${novoValor.toFixed(2)}* (multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%/mês)\n📅 Novo vencimento: *${dataFmt}*\n\nPague agora:\nhttps://gestaofc.com.br/pagar/${novoId}\n\n_${escolaNome}_`
        await enviarWhatsApp(resp.whatsapp, mensagem, cob.escolaId)
      }

      reemitidas++
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error('Erro reemissao', cob.id, err)
      erros++
    }
  }

  return NextResponse.json({ ok: true, reemitidas, erros })
}
