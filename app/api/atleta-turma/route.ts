import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/atleta-turma?turmaId=xxx
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const turmaId = req.nextUrl.searchParams.get('turmaId')
  if (!turmaId) return NextResponse.json({ error: 'turmaId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('AtletaTurma')
    .select('atletaId')
    .eq('turmaId', turmaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/atleta-turma
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { atletaId, turmaId, escolaId } = await req.json()

  const { data: existente } = await supabaseAdmin
    .from('AtletaTurma')
    .select('id')
    .eq('atletaId', atletaId)
    .eq('turmaId', turmaId)
    .single()

  if (!existente) {
    const { error } = await supabaseAdmin
      .from('AtletaTurma')
      .insert({ id: crypto.randomUUID(), atletaId, turmaId, escolaId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin.from('Atleta').update({ turmaId }).eq('id', atletaId)
  return NextResponse.json({ ok: true })
}

// DELETE /api/atleta-turma
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { atletaId, turmaId } = await req.json()

  await supabaseAdmin.from('AtletaTurma').delete().eq('atletaId', atletaId).eq('turmaId', turmaId)

  const { count } = await supabaseAdmin
    .from('AtletaTurma')
    .select('*', { count: 'exact', head: true })
    .eq('atletaId', atletaId)

  if (!count || count === 0) {
    await supabaseAdmin.from('Atleta').update({ turmaId: null }).eq('id', atletaId)
  }

  return NextResponse.json({ ok: true })
}
