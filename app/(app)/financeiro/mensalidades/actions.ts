'use server'

import { randomUUID } from 'crypto'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ⚙️ Tabela/colunas reais do seu banco:
const TABELA = 'Cobranca'
const TABELA_ATLETAS = 'Atleta'

export type Status = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'

export async function gerarMensalidades(params: {
  atletaId: string; quantidade: number; mesInicial: string; valor: number; diaVencimento: number; descricaoBase?: string
}) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { atletaId, quantidade, mesInicial, valor, diaVencimento } = params
  const [anoStr, mesStr] = mesInicial.split('-')
  let ano = Number(anoStr); let mes = Number(mesStr)
  const linhas: Record<string, unknown>[] = []
  for (let i = 0; i < quantidade; i++) {
    const mm = String(mes).padStart(2, '0'); const dd = String(diaVencimento).padStart(2, '0')
    linhas.push({
      id: randomUUID(),
      escolaId: ESCOLA_ID,
      atletaId,
      valor,
      status: 'PENDENTE' as Status,
      competencia: `${ano}-${mm}-01`,
      vencimento: `${ano}-${mm}-${dd}T12:00:00`,
      descricao: params.descricaoBase ?? `Mensalidade ${mm}/${ano}`,
    })
    mes++; if (mes > 12) { mes = 1; ano++ }
  }
  const { error } = await supabaseAdmin.from(TABELA).insert(linhas)
  if (error) throw new Error(error.message)
  return { ok: true, criadas: linhas.length }
}

export async function listarMensalidades(opts?: { status?: Status | 'todas'; incluirExcluidas?: boolean }) {
  const ESCOLA_ID = await getEscolaIdServer()
  let q = supabaseAdmin.from(TABELA)
    .select('id, atletaId, valor, status, competencia, vencimento, descricao, excluidaEm')
    .eq('escolaId', ESCOLA_ID)
    .order('competencia', { ascending: true })
  if (!opts?.incluirExcluidas) q = q.is('excluidaEm', null)
  if (opts?.status && opts.status !== 'todas') q = q.eq('status', opts.status)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  // anexa o nome do atleta (sem depender de relacionamento PostgREST)
  const { data: atletas } = await supabaseAdmin.from(TABELA_ATLETAS).select('id, nome').eq('escolaId', ESCOLA_ID)
  const mapa = new Map((atletas ?? []).map((a: { id: string; nome: string }) => [a.id, a.nome]))
  return (data ?? []).map((c: Record<string, unknown>) => ({ ...c, atleta: { nome: mapa.get(c.atletaId as string) ?? '—' } }))
}

export async function listarAtletas() {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data, error } = await supabaseAdmin.from(TABELA_ATLETAS)
    .select('id, nome').eq('escolaId', ESCOLA_ID).order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nome: string }[]
}

export async function softDeleteCobranca(id: string) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from(TABELA)
    .update({ excluidaEm: new Date().toISOString() }).eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function restaurarCobranca(id: string) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from(TABELA)
    .update({ excluidaEm: null }).eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function excluirDefinitivo(id: string) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from(TABELA).delete().eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function marcarPago(id: string) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from(TABELA)
    .update({ status: 'PAGO' as Status })
    .eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}
