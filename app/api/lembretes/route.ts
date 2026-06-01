import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  try {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

    const hoje = new Date()
    const em3dias = new Date()
    em3dias.setDate(hoje.getDate() + 3)
    const dataHoje = hoje.toISOString().split('T')[0]
    const data3dias = em3dias.toISOString().split('T')[0]

    const { data: escolas } = await supabaseAdmin.from('Escola').select('id, nome').eq('ativa', true)
    if (!escolas) return NextResponse.json({ sucesso: true, enviados: 0 })

    let totalEnviados = 0
    let totalErros = 0

    for (const escola of escolas) {
      const { data: cobrancas } = await supabaseAdmin
        .from('Cobranca')
        .select('id, valor, vencimento, descricao, atletaId')
        .eq('escolaId', escola.id)
        .eq('status', 'PENDENTE')
        .in('vencimento', [dataHoje, data3dias])

      if (!cobrancas || cobrancas.length === 0) continue

      for (const cobranca of cobrancas) {
        try {
          const { data: atleta } = await supabaseAdmin
            .from('Atleta').select('nome').eq('id', cobranca.atletaId).single()

          const { data: responsaveis } = await supabaseAdmin
            .from('Responsavel').select('nome, whatsapp')
            .eq('atletaId', cobranca.atletaId).eq('principal', true).limit(1)

          const responsavel = responsaveis?.[0]
          if (!responsavel?.whatsapp || !atleta) continue

          const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
          const nomeResp = responsavel.nome.split(' ')[0]
          const venceHoje = cobranca.vencimento === dataHoje

          const mensagem = venceHoje
            ? 'Ola ' + nomeResp + '! Aviso da *' + escola.nome + '*\n\n' +
              'A mensalidade de *' + atleta.nome + '* vence *HOJE*!\n\n' +
              'Valor: R$ ' + Number(cobranca.valor).toFixed(2) + '\n' +
              'Vencimento: ' + dataVenc + '\n\n' +
              'Pague hoje para evitar multa! \n\n_' + escola.nome + '_ '
            : 'Ola ' + nomeResp + '! Lembrete da *' + escola.nome + '*\n\n' +
              'A mensalidade de *' + atleta.nome + '* vence em *3 dias*.\n\n' +
              'Valor: R$ ' + Number(cobranca.valor).toFixed(2) + '\n' +
              'Vencimento: ' + dataVenc + '\n\n' +
              'Pague antes do vencimento para evitar multa!\n\n_' + escola.nome + '_ '

          await enviarWhatsApp(responsavel.whatsapp, mensagem)
          totalEnviados++
          await new Promise(r => setTimeout(r, 500))
        } catch {
          totalErros++
        }
      }
    }

    return NextResponse.json({ sucesso: true, enviados: totalEnviados, erros: totalErros })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
