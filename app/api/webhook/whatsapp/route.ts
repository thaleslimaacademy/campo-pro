import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const evento = body.event || body.type
    if (!['messages.upsert', 'message'].includes(evento)) return NextResponse.json({ ignorado: true })

    const msg = body.data
    if (!msg || msg.key?.fromMe) return NextResponse.json({ ignorado: true })

    const numero = (msg.key?.remoteJid || '').replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const texto = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim()
    if (!numero || !texto) return NextResponse.json({ ignorado: true })

    const nota = parseInt(texto)
    if (isNaN(nota) || nota < 0 || nota > 10 || texto !== String(nota)) {
      return NextResponse.json({ ignorado: true, motivo: 'Nao e nota NPS' })
    }

    const numeroSemCodigo = numero.startsWith('55') ? numero.slice(2) : numero
    const { data: nps } = await supabaseAdmin
      .from('NPS').select('id, escolaId, nomeAtleta')
      .eq('status', 'AGUARDANDO')
      .or(`whatsapp.ilike.%${numeroSemCodigo}`)
      .order('enviadoEm', { ascending: false })
      .limit(1).single()

    if (!nps) return NextResponse.json({ ignorado: true, motivo: 'Nenhum NPS aguardando' })

    await supabaseAdmin.from('NPS').update({
      nota,
      status: nota >= 9 ? 'PROMOTOR' : nota >= 7 ? 'NEUTRO' : 'DETRATOR',
      respondidoEm: new Date().toISOString(),
    }).eq('id', nps.id)

    return NextResponse.json({ ok: true, nota })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
