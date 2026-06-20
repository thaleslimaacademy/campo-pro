import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const turmaId = req.nextUrl.searchParams.get('turmaId')
  if (!turmaId) return NextResponse.json({ error: 'turmaId required' }, { status: 400 })

  const { data: vinculos, error } = await supabaseAdmin
    .from('AtletaTurma')
    .select('atletaId')
    .eq('turmaId', turmaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (vinculos ?? []).map((v: any) => v.atletaId)
  return NextResponse.json({ ids })
}

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

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { atletaId, turmaId } = await req.json()

  if (atletaId === '__all__') {
    await supabaseAdmin.from('AtletaTurma').delete().eq('turmaId', turmaId)
    return NextResponse.json({ ok: true })
  }

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
