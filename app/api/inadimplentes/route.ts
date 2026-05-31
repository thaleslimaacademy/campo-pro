import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: cobrancas } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor, vencimento, descricao, atletaId')
    .eq('escolaId', 'escola-demo')
    .eq('status', 'VENCIDO')

  if (!cobrancas || cobrancas.length === 0) {
    return NextResponse.json({ sucesso: true, enviados: 0 })
  }

  let enviados = 0
  for (const cobranca of cobrancas) {
    const { data: atleta } = await supabaseAdmin
      .from('Atleta')
      .select('nome')
      .eq('id', cobranca.atletaId)
      .single()

    const { data: responsaveis } = await supabaseAdmin
      .from('Responsavel')
      .select('nome, whatsapp')
      .eq('atletaId', cobranca.atletaId)
      .limit(1)

    const responsavel = responsaveis?.[0]
    if (!responsavel?.whatsapp || !atleta) continue

    const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
    const nomeResp = responsavel.nome.split(' ')[0]
    const diasAtraso = Math.floor((new Date().getTime() - new Date(cobranca.vencimento + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))

    const mensagem = "Ola " + nomeResp + "! Aviso importante da *Thales Lima Football Academy*\n\n" +
      "A mensalidade de *" + atleta.nome + "* esta em atraso ha *" + diasAtraso + " dias*!\n\n" +
      "Valor: R$ " + Number(cobranca.valor).toFixed(2) + "\n" +
      "Vencimento: " + dataVenc + "\n\n" +
      "Por favor regularize o quanto antes para evitar a suspensao das atividades.\n\n" +
      "Em caso de duvidas, entre em contato: wa.me/5534998168467\n\n" +
      "_Thales Lima Football Academy_"

    await enviarWhatsApp(responsavel.whatsapp, mensagem)
    enviados++
    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ sucesso: true, enviados })
}
