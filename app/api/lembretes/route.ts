import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const em3dias = new Date()
    em3dias.setDate(em3dias.getDate() + 3)
    const data3dias = em3dias.toISOString().split('T')[0]

    const { data: cobrancas } = await supabase
      .from('Cobranca')
      .select('id, valor, vencimento, descricao, atletaId')
      .eq('escolaId', 'escola-demo')
      .eq('status', 'PENDENTE')
      .eq('vencimento', data3dias)

    if (!cobrancas || cobrancas.length === 0) {
      return NextResponse.json({ sucesso: true, enviados: 0, mensagem: 'Nenhuma cobrança vencendo em 3 dias' })
    }

    let enviados = 0
    let erros = 0

    for (const cobranca of cobrancas) {
      try {
        const { data: atleta } = await supabase
          .from('Atleta')
          .select('nome')
          .eq('id', cobranca.atletaId)
          .single()

        const { data: responsaveis } = await supabase
          .from('Responsavel')
          .select('nome, whatsapp')
          .eq('atletaId', cobranca.atletaId)
          .eq('principal', true)
          .limit(1)

        const responsavel = responsaveis?.[0]
        if (!responsavel?.whatsapp || !atleta) continue

        const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
        const nomeResp = responsavel.nome.split(' ')[0]

        const mensagem =
          `Olá ${nomeResp}! 📅\n\n` +
          `Lembrete: a mensalidade de *${atleta.nome}* vence em *3 dias*.\n\n` +
          `💰 *Valor:* R$ ${Number(cobranca.valor).toFixed(2)}\n` +
          `📅 *Vencimento:* ${dataVenc}\n` +
          `📝 *${cobranca.descricao || 'Mensalidade'}*\n\n` +
          `Para evitar multa e juros, pague antes do vencimento! 🙏\n\n` +
          `_Thales Lima Football Academy_ ⚽`

        await enviarWhatsApp(responsavel.whatsapp, mensagem)
        enviados++
        await new Promise(r => setTimeout(r, 500))
      } catch {
        erros++
      }
    }

    console.log(`✅ Lembretes: ${enviados} enviados, ${erros} erros`)
    return NextResponse.json({ sucesso: true, enviados, erros })

  } catch (err: any) {
    console.error('❌ Erro lembretes:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}