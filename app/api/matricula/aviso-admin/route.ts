import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
// TODO: sem template proprio, so alcanca a escola se ela tiver escrito pro
// numero nas ultimas 24h (janela de conversa da Meta).
import { enviarTextoMeta } from '@/lib/whatsapp-meta'

// Rota pública — sem Clerk
export async function POST(req: NextRequest) {
  try {
    const { matriculaId, escolaId } = await req.json()

    const { data: mat } = await supabaseAdmin
      .from('Matricula').select('nomeAtleta, nomeResponsavel, whatsappResponsavel').eq('id', matriculaId).single()
    const { data: escola } = await supabaseAdmin
      .from('Escola').select('whatsapp, nome, valorMatricula').eq('id', escolaId).single()

    if (!mat || !escola?.whatsapp) return NextResponse.json({ ok: true, aviso: 'sem whatsapp admin' })

    const valor = Number(escola.valorMatricula || 0)
    const mensagem =
      `🏫 *Nova pré-matrícula — Pagamento em Dinheiro*

` +
      `Atleta: *${mat.nomeAtleta}*
` +
      `Responsável: ${mat.nomeResponsavel}
` +
      `WhatsApp: ${mat.whatsappResponsavel}
` +
      `Valor da taxa: *R$ ${valor.toFixed(2)}*

` +
      `O responsável optou por pagar a taxa de matrícula em *dinheiro*. Combine o pagamento presencialmente.

` +
      `_${escola.nome}_`

    try {
      await enviarTextoMeta(escola.whatsapp, mensagem)
    } catch (e) { console.error('Erro WhatsApp aviso-admin:', (e as Error).message) }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[aviso-admin]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
