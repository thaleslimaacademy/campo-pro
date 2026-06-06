import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { convocacaoId } = await req.json()
  if (!convocacaoId) return NextResponse.json({ error: 'convocacaoId obrigatorio' }, { status: 400 })

  const { data: convocacao } = await supabaseAdmin
    .from('Convocacao')
    .select('*')
    .eq('id', convocacaoId)
    .single()

  if (!convocacao) return NextResponse.json({ error: 'Convocacao nao encontrada' }, { status: 404 })

  const { data: atletasConvocados } = await supabaseAdmin
    .from('ConvocacaoAtleta')
    .select('atletaId')
    .eq('convocacaoId', convocacaoId)

  if (!atletasConvocados || atletasConvocados.length === 0) {
    return NextResponse.json({ sucesso: true, enviados: 0 })
  }

  const dataEvento = convocacao.data
    ? new Date(convocacao.data + 'T12:00:00').toLocaleDateString('pt-BR')
    : 'a confirmar'

  let enviados = 0
  for (const ca of atletasConvocados) {
    const { data: atleta } = await supabaseAdmin
      .from('Atleta')
      .select('nome, telefone')
      .eq('id', ca.atletaId)
      .single()

    const { data: responsaveis } = await supabaseAdmin
      .from('Responsavel')
      .select('whatsapp, nome')
      .eq('atletaId', ca.atletaId)
      .limit(1)

    const whatsapp = responsaveis?.[0]?.whatsapp || atleta?.telefone
    if (!whatsapp || !atleta) continue

    const nomeResp = responsaveis?.[0]?.nome?.split(' ')[0] || atleta.nome.split(' ')[0]

    const mensagem = "Ola " + nomeResp + "! \n\n" +
      "*" + atleta.nome + "* foi convocado(a) para:\n\n" +
      "*" + (convocacao.titulo || 'Evento') + "*\n" +
      "Tipo: " + (convocacao.tipo || '') + "\n" +
      "Data: " + dataEvento + "\n" +
      (convocacao.local ? "Local: " + convocacao.local + "\n" : '') +
      (convocacao.horario ? "Horario: " + convocacao.horario + "\n" : '') +
      "\nConfirme a presenca pelo link:\n" +
      "https://gestaofc.com.br/pais/" + (atleta as any).tokenPais + "\n\n" +
      "_Thales Lima Football Academy_"

    await enviarWhatsApp(whatsapp, mensagem)
    enviados++
    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ sucesso: true, enviados })
}
