import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const escolaId = req.nextUrl.searchParams.get('escolaId')
  if (!escolaId) return NextResponse.json({ error: 'escolaId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('AtletaTurma')
    .select('turmaId')
    .eq('escolaId', escolaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.turmaId] = (counts[row.turmaId] ?? 0) + 1
  }

  return NextResponse.json(counts)
}
