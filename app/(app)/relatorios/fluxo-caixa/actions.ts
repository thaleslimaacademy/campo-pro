'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export type MesData = {
  mes: string
  mensalidades: number
  receitas: number
  despesas: number
  saldo: number
  recCats: Record<string, number>
  despCats: Record<string, number>
}

export async function carregarFluxoPeriodo(inicio: string, fim: string): Promise<MesData[]> {
  const ESCOLA_ID = await getEscolaIdServer()

  const [{ data: cobr }, { data: rec }, { data: desp }] = await Promise.all([
    supabaseAdmin.from('Cobranca').select('valor, competencia')
      .eq('escolaId', ESCOLA_ID).eq('status', 'PAGO')
      .gte('competencia', inicio + '-01').lte('competencia', fim + '-31'),
    supabaseAdmin.from('Receita').select('valor, categoria, data')
      .eq('escolaId', ESCOLA_ID).gte('data', inicio + '-01').lte('data', fim + '-31'),
    supabaseAdmin.from('Despesa').select('valor, categoria, data')
      .eq('escolaId', ESCOLA_ID).gte('data', inicio + '-01').lte('data', fim + '-31'),
  ])

  const meses: string[] = []
  let [ano, mes] = inicio.split('-').map(Number)
  const [anoF, mesF] = fim.split('-').map(Number)
  while (ano < anoF || (ano === anoF && mes <= mesF)) {
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`)
    mes++; if (mes > 12) { mes = 1; ano++ }
  }

  return meses.map(m => {
    const pfx = m + '-'
    const mensal = (cobr || []).filter(c => (c.competencia || '').startsWith(pfx)).reduce((s, c) => s + (c.valor || 0), 0)
    const recMes = (rec || []).filter(r => (r.data || '').startsWith(pfx))
    const despMes = (desp || []).filter(d => (d.data || '').startsWith(pfx))
    const totalRec = recMes.reduce((s, r) => s + (r.valor || 0), 0)
    const totalDesp = despMes.reduce((s, d) => s + (d.valor || 0), 0)
    const recCats: Record<string, number> = {}
    recMes.forEach(r => { recCats[r.categoria || 'OUTRA'] = (recCats[r.categoria || 'OUTRA'] || 0) + r.valor })
    const despCats: Record<string, number> = {}
    despMes.forEach(d => { despCats[d.categoria || 'OUTRA'] = (despCats[d.categoria || 'OUTRA'] || 0) + d.valor })
    return { mes: m, mensalidades: mensal, receitas: totalRec, despesas: totalDesp, saldo: mensal + totalRec - totalDesp, recCats, despCats }
  })
}

export async function getEscolaNome() {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Escola').select('nome').eq('id', ESCOLA_ID).single()
  return data?.nome || 'Escola'
}
