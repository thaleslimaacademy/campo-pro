import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: escolas } = await supabaseAdmin.from('Escola').select('id, nome').eq('ativa', true)
  if (!escolas) return NextResponse.json({ sucesso: true, enviados: 0 })

  let totalEnviados = 0

  for (const escola of escolas) {
    const { data: cobrancas } = await supabaseAdmin
      .from('Cobranca')
      .select('id, valor, vencimento, descricao, atletaId')
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
      const nomeResp = responsavel.nome.split(' ')[0]
      const diasAtraso = Math.floor((new Date().getTime() - new Date(cobranca.vencimento + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))

      const mensagem = 'Ola ' + nomeResp + '! Aviso importante da *' + escola.nome + '*\n\n' +
        'A mensalidade de *' + atleta.nome + '* esta em atraso ha *' + diasAtraso + ' dias*!\n\n' +
        'Valor: R$ ' + Number(cobranca.valor).toFixed(2) + '\n' +
        'Vencimento: ' + dataVenc + '\n\n' +
        'Por favor regularize o quanto antes para evitar a suspensao das atividades.\n\n' +
        '_' + escola.nome + '_'

      await enviarWhatsApp(responsavel.whatsapp, mensagem)
      totalEnviados++
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({ sucesso: true, enviados: totalEnviados })
}
