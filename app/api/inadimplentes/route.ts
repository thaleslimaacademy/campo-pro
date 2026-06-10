import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: escolas } = await supabaseAdmin
    .from('Escola').select('id, nome').eq('ativa', true)

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
      try {
        const diasAtraso = Math.floor(
          (Date.now() - new Date(cobranca.vencimento.slice(0, 10) + 'T12:00:00').getTime())
          / (1000 * 60 * 60 * 24)
        )

        // ✅ Só envia a cada 3 dias após vencimento (dia 3, 6, 9, 12...)
        if (diasAtraso <= 0 || diasAtraso % 3 !== 0) continue

        const { data: atleta } = await supabaseAdmin
          .from('Atleta').select('nome').eq('id', cobranca.atletaId).single()

        // ✅ Filtra responsável principal
        const { data: resps } = await supabaseAdmin
          .from('Responsavel').select('nome, whatsapp')
          .eq('atletaId', cobranca.atletaId).eq('principal', true).limit(1)

        const responsavel = resps?.[0]
        if (!responsavel?.whatsapp || !atleta) continue

        const dataVenc = cobranca.vencimento.slice(0, 10).split('-').reverse().join('/')
        const nome = responsavel.nome.split(' ')[0]
        const link = 'https://gestaofc.com.br/pagar/' + cobranca.id

        const msg = [
          `🚨 *MENSALIDADE EM ATRASO — ${diasAtraso} DIAS*`,
          ``,
          `Olá, *${nome}*!`,
          ``,
          `A mensalidade de *${atleta.nome}* está em atraso há *${diasAtraso} dias*.`,
          ``,
          `💰 Valor: *R$ ${Number(cobranca.valor).toFixed(2)}*`,
          `📅 Vencimento original: ${dataVenc}`,
          ``,
          `⚠️ O não pagamento pode resultar na *suspensão do aluno*.`,
          ``,
          `Regularize agora:`,
          link,
          ``,
          `_Thales Lima Football Academy_`,
        ].join('\n')

        await enviarWhatsApp(responsavel.whatsapp, msg)
        totalEnviados++
        await new Promise(r => setTimeout(r, 600))
      } catch (err) {
        console.error('Erro inadimplente', cobranca.id, err)
      }
    }
  }

  return NextResponse.json({ sucesso: true, enviados: totalEnviados })
}