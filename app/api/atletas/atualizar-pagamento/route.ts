import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function POST(req: NextRequest) {
  const escolaId = await getEscolaIdServer()
  const { atletaId, diaVencimento, valorMensalidade } = await req.json()
  if (!atletaId) return NextResponse.json({ error: 'atletaId obrigatório' }, { status: 400 })

  const { error } = await supabaseAdmin.from('Atleta').update({
    ...(diaVencimento ? { diaVencimento: Number(diaVencimento) } : {}),
    ...(valorMensalidade ? { valorMensalidade: Number(valorMensalidade) } : {}),
  }).eq('id', atletaId).eq('escolaId', escolaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
