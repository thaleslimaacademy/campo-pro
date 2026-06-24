import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rota pública — sem Clerk (responsável externo)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { escolaId, ...campos } = body

    if (!escolaId) return NextResponse.json({ error: 'escolaId obrigatório' }, { status: 400 })

    // Confirmar que escola existe
    const { data: escola } = await supabaseAdmin
      .from('Escola').select('id').eq('id', escolaId).single()
    if (!escola) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from('Matricula')
      .insert({ escolaId, ...campos })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[matricula/criar]', error?.message)
      return NextResponse.json({ error: error?.message || 'Erro ao inserir matrícula' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: any) {
    console.error('[matricula/criar]', err.message)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
