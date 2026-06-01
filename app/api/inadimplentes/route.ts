import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

function aplicarVariaveis(template: string, vars: Record<string, string>): string {
  let msg = template
  for (const [key, val] of Object.entries(vars)) {
    msg = msg.replaceAll(key, val)
  }
  return msg
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: escolas } = await supabaseAdmin
    .from('Escola')
    .select('id, nome, msgInadimplente')
    .eq('ativa', true)

  if (!escolas) return NextResponse.json({ sucesso: true, enviados: 0 })

  let totalEnviados = 0

  for (const escola of escolas) {
    const { data: cobrancas } = await supabaseAdmin
      .from('Cobranca')
      .select('id, valor, vencimento, atletaId')
      .eq('escolaId', escola.id)
      .eq('status', 'VENCIDO')

    if (!cobrancas || cobrancas.length === 0) continue

    for (const cobranca of cobrancas) {
      const { data: atleta } = await supabaseAdmin
        .from('Atleta').select('nome').eq('id', cobranca.atletaId).single()

      const { data: responsaveis } = await supabaseAdmin
        .from('Responsavel').select('nome, whatsapp').eq('atletaId', cobranca.atletaId).limit(1)

      const responsavel = responsaveis?.[0]
      if (!responsavel?.whatsapp || !atleta) continue

      const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      const diasAtraso = Math.floor((new Date().getTime() - new Date(cobranca.vencimento + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))

      const template = escola.msgInadimplente || 'Ola {nome_responsavel}! A mensalidade de *{nome_atleta}* esta em atraso ha *{dias_atraso} dias*! Valor: R$ {valor}. Vencimento: {data_vencimento}. _{nome_escola}_'

      const mensagem = aplicarVariaveis(template, {
        '{nome_responsavel}': responsavel.nome.split(' ')[0],
        '{nome_atleta}': atleta.nome,
        '{nome_escola}': escola.nome,
        '{valor}': Number(cobranca.valor).toFixed(2),
        '{data_vencimento}': dataVenc,
        '{dias_atraso}': String(diasAtraso),
      })

      await enviarWhatsApp(responsavel.whatsapp, mensagem)
      totalEnviados++
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({ sucesso: true, enviados: totalEnviados })
}
