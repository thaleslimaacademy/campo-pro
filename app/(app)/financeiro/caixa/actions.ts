'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

const ESCOLA_ID = 'escola-demo'

export async function carregarCaixa(mes: string) {
  const [anoStr, mesStr] = mes.split('-')
  const ano = Number(anoStr), m = Number(mesStr)
  const inicio = `${mes}-01`
  const fim = `${mes}-${String(new Date(ano, m, 0).getDate()).padStart(2, '0')}`

  const [{ data: cobr }, { data: atl }, { data: rec }, { data: desp }] = await Promise.all([
    supabaseAdmin.from('Cobranca').select('id, atletaId, valor, competencia, descricao')
      .eq('escolaId', ESCOLA_ID).eq('status', 'PAGO')
      .gte('competencia', inicio).lte('competencia', fim),
    supabaseAdmin.from('Atleta').select('id, nome').eq('escolaId', ESCOLA_ID),
    supabaseAdmin.from('Receita').select('id, valor, descricao, categoria, data')
      .eq('escolaId', ESCOLA_ID).gte('data', inicio).lte('data', fim).order('data'),
    supabaseAdmin.from('Despesa').select('id, valor, descricao, categoria, data')
      .eq('escolaId', ESCOLA_ID).gte('data', inicio).lte('data', fim).order('data'),
  ])

  const mapa = new Map((atl ?? []).map((a: { id: string; nome: string }) => [a.id, a.nome]))
  const mensalidades = (cobr ?? []).map((c: Record<string, unknown>) => ({
    ...c, nome: mapa.get(c.atletaId as string) ?? '—',
  }))

  return { mensalidades, receitas: rec ?? [], despesas: desp ?? [] }
}

export async function criarReceita(p: { valor: number; descricao: string; categoria: string; data: string }) {
  const { error } = await supabaseAdmin.from('Receita').insert({ escolaId: ESCOLA_ID, ...p })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function excluirReceita(id: string) {
  const { error } = await supabaseAdmin.from('Receita').delete().eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function criarDespesa(p: { valor: number; descricao: string; categoria: string; data: string }) {
  const { error } = await supabaseAdmin.from('Despesa').insert({ escolaId: ESCOLA_ID, ...p })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function excluirDespesa(id: string) {
  const { error } = await supabaseAdmin.from('Despesa').delete().eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}