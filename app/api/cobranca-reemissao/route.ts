import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelarCobrancaAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { enviarWhatsApp } from '@/lib/whatsapp'

function diasAtras(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function diasAFrente(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const hoje = new Date().toISOString().slice(0, 10)
  const amanha = diasAFrente(1)

  // D+1: venceu ontem → reemite com multa+juros e novo PIX
  // D+4: venceu há 4 dias → lembrete WhatsApp (sem reemitir)
  // D+10: venceu há 10 dias → aviso final WhatsApp (sem reemitir)
  const checkDias = [
    { diasAtras: 1, acao: 'reemitir' },
    { diasAtras: 4, acao: 'lembrete' },
    { diasAtras: 10, acao: 'aviso_final' },
  ]

  let reemitidas = 0, lembretes = 0, erros = 0

  for (const { diasAtras: n, acao } of checkDias) {
    const dataAlvo = diasAtras(n)

    const { data: cobVencidas } = await supabaseAdmin.from('Cobranca')
      .select('id, valor, asaasId, atletaId, escolaId, descricao')
      .in('status', ['PENDENTE', 'VENCIDO'])
      .eq('vencimento', dataAlvo)

    if (!cobVencidas?.length) continue

    for (const cob of cobVencidas) {
      try {
        const apiKey = await getAsaasKey(cob.escolaId)
        const { data: escolaConfig } = await supabaseAdmin.from('Escola')
          .select('multaAtraso, jurosAoMes, nome, evolutionInstance')
          .eq('id', cob.escolaId).single()

        const multaFixa  = Number(escolaConfig?.multaAtraso || 15)
        const jurosPct   = Number(escolaConfig?.jurosAoMes || 1)
        const escolaNome = escolaConfig?.nome?.split('—').pop()?.trim() || 'GestãoFC'

        const { data: atleta } = await supabaseAdmin.from('Atleta')
          .select('nome, asaasCustomerId').eq('id', cob.atletaId).single()

        const { data: resps } = await supabaseAdmin.from('Responsavel')
          .select('nome, whatsapp').eq('atletaId', cob.atletaId).eq('principal', true).limit(1)
        const resp = resps?.[0]

        // ── D+1: reemite cobrança com multa + juros ──
        if (acao === 'reemitir') {
          await supabaseAdmin.from('Cobranca').update({ status: 'VENCIDO' }).eq('id', cob.id)

          const valorBase  = Number(cob.valor)
          const valorJuros = valorBase * (jurosPct / 100)
          const novoValor  = valorBase + multaFixa + valorJuros
          const novoId     = crypto.randomUUID()
          const descricao  = `Mensalidade em atraso + multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%`

          if (atleta?.asaasCustomerId && apiKey) {
            if (cob.asaasId) await cancelarCobrancaAsaas(apiKey, cob.asaasId)
            const nova = await criarCobrancaPix(apiKey, {
              customer: atleta.asaasCustomerId, billingType: 'PIX',
              value: novoValor, dueDate: amanha, description: descricao,
            })
            if (!nova.errors) {
              const qr = await getPixQrCode(apiKey, nova.id)
              await supabaseAdmin.from('Cobranca').insert({
                id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId,
                atletaNome: atleta.nome, valor: novoValor, vencimento: amanha,
                status: 'PENDENTE', asaasId: nova.id,
                pixCopiaCola: qr.payload || null, pixQrCode: qr.encodedImage || null, descricao,
              })
            }
          } else {
            await supabaseAdmin.from('Cobranca').insert({
              id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId,
              atletaNome: atleta?.nome || null, valor: novoValor, vencimento: amanha,
              status: 'PENDENTE', tipo: 'MANUAL', descricao,
            })
          }

          if (resp?.whatsapp && atleta) {
            const nomeResp = resp.nome.split(' ')[0]
            const dataFmt = new Date(amanha + 'T12:00:00').toLocaleDateString('pt-BR')
            await enviarWhatsApp(resp.whatsapp,
              `Ola ${nomeResp}! ⚠️\n\nA mensalidade de *${atleta.nome}* venceu ontem e não foi paga.\n\nFoi gerada nova cobrança com acréscimo:\n💰 *R$ ${novoValor.toFixed(2)}* (multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%/mês)\n📅 Novo vencimento: *${dataFmt}*\n\nPague agora:\nhttps://gestaofc.com.br/pagar/${novoId}\n\n_${escolaNome}_`,
              cob.escolaId)
          }
          reemitidas++
        }

        // ── D+4: lembrete ──
        else if (acao === 'lembrete') {
          if (resp?.whatsapp && atleta) {
            const nomeResp = resp.nome.split(' ')[0]
            const valor = Number(cob.valor).toFixed(2)
            await enviarWhatsApp(resp.whatsapp,
              `Ola ${nomeResp}! 🔔\n\n*Lembrete:* a mensalidade de *${atleta.nome}* está em atraso há 4 dias.\n\n💰 Valor pendente: *R$ ${valor}*\n\nRegularize o quanto antes para evitar acréscimos maiores.\n\nhttps://gestaofc.com.br/pagar/${cob.id}\n\n_${escolaNome}_`,
              cob.escolaId)
            lembretes++
          }
        }

        // ── D+10: aviso final ──
        else if (acao === 'aviso_final') {
          if (resp?.whatsapp && atleta) {
            const nomeResp = resp.nome.split(' ')[0]
            const valor = Number(cob.valor).toFixed(2)
            await enviarWhatsApp(resp.whatsapp,
              `Ola ${nomeResp}! 🚨\n\n*Aviso importante:* a mensalidade de *${atleta.nome}* está em atraso há 10 dias.\n\n💰 Valor pendente: *R$ ${valor}*\n\nEntre em contato com a secretaria para regularizar sua situação e evitar a suspensão das atividades.\n\n_${escolaNome}_`,
              cob.escolaId)
            lembretes++
          }
        }

        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        console.error('Erro reemissao', cob.id, err)
        erros++
      }
    }
  }

  return NextResponse.json({ ok: true, reemitidas, lembretes, erros, data: hoje })
}
