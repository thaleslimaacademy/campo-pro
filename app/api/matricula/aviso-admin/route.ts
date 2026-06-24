import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

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

    await enviarWhatsApp(escola.whatsapp, mensagem)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[aviso-admin]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
