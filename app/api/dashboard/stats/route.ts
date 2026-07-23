import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { cookies } from 'next/headers'

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']

export async function GET() {
  const escolaId = await getEscolaIdServer()

  const hoje = new Date()
  const di = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const df = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  const hojeStr = hoje.toISOString().slice(0, 10)

  const [escola, atletas, pendentes, cobrancas, treino] = await Promise.all([
    supabaseAdmin.from('Escola').select('nome, slug').eq('id', escolaId).single(),
    supabaseAdmin.from('Atleta').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('ativo', true),
    supabaseAdmin.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE'),
    supabaseAdmin.from('Cobranca').select('valor, status, vencimento, atletaId').eq('escolaId', escolaId).is('excluidaEm', null).gte('vencimento', di).lte('vencimento', df),
    supabaseAdmin.from('Treino').select('id').eq('escolaId', escolaId).gte('data', hojeStr).limit(1).single(),
  ])

  type Cob = { status: string; valor: number; vencimento: string; atletaId: string }
  const cobs = (cobrancas.data || []) as Cob[]
  const pagasV = cobs.filter(c => c.status === 'PAGO').reduce((s: number, c) => s + Number(c.valor), 0)

  // Inadimplente = ATLETA (nao cobranca) com mensalidade nao paga cujo
  // vencimento ja passou. Antes contava so status === 'VENCIDO', mas a regua
  // so marca VENCIDO no D+15 — e nao filtrava as cobrancas da lixeira, o que
  // fazia o dashboard acusar inadimplente que a tela de mensalidades nao mostra.
  const atletasInadimplentes = new Set(
    cobs
      .filter(c => (c.status === 'PENDENTE' || c.status === 'VENCIDO') && c.vencimento < hojeStr)
      .map(c => c.atletaId)
  )
  const inadimplentes = atletasInadimplentes.size

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
    isOverride: !!(await cookies()).get('escola_override')?.value,
    totalAtletas: atletas.count ?? 0,
    matriculasPendentes: pendentes.count ?? 0,
    pagasV,
    inadimplentes,
    presenca,
  })
}
