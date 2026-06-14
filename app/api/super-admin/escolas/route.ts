import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { sessionClaims } = await auth()
  const meta = (sessionClaims?.metadata as any) || {}
  
  if (meta.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: escolas } = await supabaseAdmin
    .from('Escola')
    .select('*')
    .order('createdAt', { ascending: false })

  if (!escolas) return NextResponse.json([])

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0]

  const stats = await Promise.all(escolas.map(async (escola) => {
    const { count: totalAtletas } = await supabaseAdmin
      .from('Atleta')
      .select('*', { count: 'exact', head: true })
      .eq('escolaId', escola.id)
      .eq('ativo', true)

    const { data: cobrancas } = await supabaseAdmin
      .from('Cobranca')
      .select('valor, status')
      .eq('escolaId', escola.id)
      .gte('vencimento', inicioMes)
      .lte('vencimento', fimMes)

    const receitaMes = cobrancas
      ?.filter(c => c.status === 'PAGO')
      .reduce((s, c) => s + Number(c.valor), 0) || 0

    return {
      ...escola,
      totalAtletas: totalAtletas || 0,
      totalCobrancas: cobrancas?.length || 0,
      receitaMes,
    }
  }))

  return NextResponse.json(stats)
}
