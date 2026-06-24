import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function GET(req: NextRequest) {
  const escolaId = await getEscolaIdServer()
  const exercicioId = req.nextUrl.searchParams.get('exercicioId')
  if (!exercicioId) return NextResponse.json({ error: 'exercicioId obrigatorio' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('DiagramaTreino').select('elementos')
    .eq('escolaId', escolaId).eq('exercicioId', exercicioId).single()

  return NextResponse.json({ elementos: data?.elementos || null })
}

export async function POST(req: NextRequest) {
  const escolaId = await getEscolaIdServer()
  const { exercicioId, elementos } = await req.json()
  if (!exercicioId) return NextResponse.json({ error: 'exercicioId obrigatorio' }, { status: 400 })

  await supabaseAdmin.from('DiagramaTreino').upsert(
    { escolaId, exercicioId, elementos, atualizadoEm: new Date().toISOString() },
    { onConflict: 'escolaId,exercicioId' }
  )
  return NextResponse.json({ ok: true })
}
