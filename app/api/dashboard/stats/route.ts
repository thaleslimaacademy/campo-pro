import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function GET() {
  const escolaId = await getEscolaIdServer()

  const hoje = new Date()
  const di = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const df = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  const hojeStr = hoje.toISOString().slice(0, 10)

  const [escola, atletas, pendentes, cobrancas, treino] = await Promise.all([
    supabaseAdmin.from('Escola').select('nome, slug').eq('id', escolaId).single(),
    supabaseAdmin.from('Atleta').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('ativo', true),
    supabaseAdmin.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE').eq('tipo', 'matricula'),
    supabaseAdmin.from('Cobranca').select('valor, status').eq('escolaId', escolaId).gte('vencimento', di).lte('vencimento', df),
    supabaseAdmin.from('Treino').select('id').eq('escolaId', escolaId).gte('data', hojeStr).limit(1).single(),
  ])

  const cobs = cobrancas.data || []
  const pagasV = cobs.filter((c: {status: string; valor: number}) => c.status === 'PAGO').reduce((s: number, c: {valor: number}) => s + Number(c.valor), 0)
  const inadimplentes = cobs.filter((c: {status: string}) => c.status === 'VENCIDO').length

  let presenca = { p: 0, t: 0 }
  if (treino.data) {
    const { data: p } = await supabaseAdmin.from('Presenca').select('status').eq('treinoId', treino.data.id)
    presenca = {
      p: p?.filter((x: {status: string}) => x.status === 'PRESENTE').length || 0,
      t: p?.length || 0,
    }
  }

  return NextResponse.json({
    escola: escola.data?.nome ?? '',
    escolaSlug: escola.data?.slug ?? '',
    totalAtletas: atletas.count ?? 0,
    matriculasPendentes: pendentes.count ?? 0,
    pagasV,
    inadimplentes,
    presenca,
  })
}
