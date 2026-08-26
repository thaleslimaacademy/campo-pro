import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { msgConvocacao } from '@/lib/whatsapp-templates'

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
      .select('nome, telefone, escolaId, tokenPais')
      .eq('id', ca.atletaId)
      .single()

    const { data: responsaveis } = await supabaseAdmin
      .from('Responsavel')
      .select('whatsapp, nome')
      .eq('atletaId', ca.atletaId)
      .limit(1)

    const whatsapp = responsaveis?.[0]?.whatsapp || atleta?.telefone
    if (!whatsapp || !atleta) continue

    try {
      await msgConvocacao({
        telefone: whatsapp,
        nomeAtleta: atleta.nome,
        titulo: convocacao.titulo || 'Evento',
        data: dataEvento,
        horario: convocacao.horario || 'a confirmar',
        local: convocacao.local || 'a confirmar',
        linkConfirmacao: atleta.tokenPais ? `https://gestaofc.com.br/pais/${atleta.tokenPais}` : undefined,
        escolaId: atleta.escolaId,
      })
      enviados++
    } catch (e) {
      console.error('Erro WhatsApp convocacao:', (e as Error).message)
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ sucesso: true, enviados })
}
