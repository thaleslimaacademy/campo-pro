'use server'
/**
 * Leituras que antes eram feitas direto do navegador com a chave publica
 * (anon). Agora passam pelo servidor, sempre filtradas pela escola da sessao.
 * Com isso o banco pode fechar a leitura publica de atletas, responsaveis,
 * cobrancas e presencas.
 */
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ── Relatorios ──────────────────────────────────────────────────────────────
export async function relPresencas(atletaId: string, inicio: string, fim: string) {
  const escolaId = await getEscolaIdServer()
  const { data: at } = await supabaseAdmin.from('Atleta').select('id').eq('id', atletaId).eq('escolaId', escolaId).maybeSingle()
  if (!at) return []
  const { data } = await supabaseAdmin.from('Presenca').select('status, criadoEm')
    .eq('atletaId', atletaId).gte('criadoEm', inicio).lte('criadoEm', fim + 'T23:59:59').order('criadoEm', { ascending: true })
  return (data ?? []) as { status: string; criadoEm: string }[]
}

export async function relCobrancas(mes: string) {
  const escolaId = await getEscolaIdServer()
  const [a, m] = mes.split('-').map(Number)
  const fim = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10) // ultimo dia real do mes
  const { data: cobrancas } = await supabaseAdmin.from('Cobranca')
    .select('id, valor, status, descricao, vencimento, atletaId')
    .eq('escolaId', escolaId).is('excluidaEm', null)
    .gte('vencimento', mes + '-01').lte('vencimento', fim + 'T23:59:59').order('vencimento', { ascending: true })
  const lista = (cobrancas ?? []) as { id: string; valor: number; status: string; descricao: string | null; vencimento: string; atletaId: string }[]
  const ids = [...new Set(lista.map(c => c.atletaId).filter(Boolean))]
  const { data: ats } = ids.length
    ? await supabaseAdmin.from('Atleta').select('id, nome').in('id', ids).eq('escolaId', escolaId)
    : { data: [] }
  const nomes: Record<string, string> = {}
  for (const x of (ats ?? []) as { id: string; nome: string }[]) nomes[x.id] = x.nome
  return { cobrancas: lista, nomes }
}

export async function relAtletas(turmaId?: string | null) {
  const escolaId = await getEscolaIdServer()
  let q = supabaseAdmin.from('Atleta').select('id, nome, posicao, dataNascimento, turmaId')
    .eq('escolaId', escolaId).eq('ativo', true).order('nome')
  if (turmaId) q = q.eq('turmaId', turmaId)
  const { data } = await q
  return (data ?? []) as { id: string; nome: string; posicao: string | null; dataNascimento: string | null; turmaId: string | null }[]
}

// ── Convocacao (pagina de detalhe / impressao) ────────────────────────────
export async function convocacaoDetalhe(id: string) {
  const escolaId = await getEscolaIdServer()
  const { data: conv } = await supabaseAdmin.from('Convocacao').select('*').eq('id', id).eq('escolaId', escolaId).maybeSingle()
  if (!conv) return { conv: null, atletas: [] }
  const { data: cas } = await supabaseAdmin.from('ConvocacaoAtleta').select('atletaId').eq('convocacaoId', id)
  const ids = ((cas ?? []) as { atletaId: string }[]).map(c => c.atletaId)
  const { data: ats } = ids.length
    ? await supabaseAdmin.from('Atleta').select('id, nome, posicao, fotoUrl').in('id', ids).eq('escolaId', escolaId).order('nome')
    : { data: [] }
  return { conv, atletas: ats ?? [] }
}

// ── Alteracao em massa ────────────────────────────────────────────────────
export async function massaDados() {
  const escolaId = await getEscolaIdServer()
  const [{ data: atletas }, { data: turmas }] = await Promise.all([
    supabaseAdmin.from('Atleta').select('id, nome, turmaId, diaVencimento, valorMensalidade, dataNascimento')
      .eq('escolaId', escolaId).eq('ativo', true).order('nome'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
  ])
  return { atletas: atletas ?? [], turmas: turmas ?? [] }
}

/** So estes campos podem ser alterados em massa. */
export async function massaAplicar(ids: string[], update: { diaVencimento?: number; valorMensalidade?: number; turmaId?: string }) {
  const { escolaId } = await requireFinanceiro()
  const campos: Record<string, unknown> = {}
  if (update.diaVencimento != null) {
    const d = Math.round(Number(update.diaVencimento))
    if (!(d >= 1 && d <= 28)) return { ok: false as const, erro: 'O dia de vencimento deve ficar entre 1 e 28.' }
    campos.diaVencimento = d
  }
  if (update.valorMensalidade != null) {
    const v = Number(update.valorMensalidade)
    if (!(v >= 0 && v <= 10000)) return { ok: false as const, erro: 'Valor de mensalidade inválido.' }
    campos.valorMensalidade = v
  }
  if (update.turmaId) {
    const { data: t } = await supabaseAdmin.from('Turma').select('id').eq('id', update.turmaId).eq('escolaId', escolaId).maybeSingle()
    if (!t) return { ok: false as const, erro: 'Turma não encontrada.' }
    campos.turmaId = update.turmaId
  }
  if (!Object.keys(campos).length || !ids.length) return { ok: false as const, erro: 'Nada para alterar.' }
  const { data, error } = await supabaseAdmin.from('Atleta').update(campos).in('id', ids).eq('escolaId', escolaId).select('id')
  if (error) return { ok: false as const, erro: error.message }
  revalidatePath('/alteracao-massa')
  return { ok: true as const, alterados: data?.length ?? 0 }
}

// ── Financeiro (tela antiga) ──────────────────────────────────────────────
export async function financeiroLegado() {
  const escolaId = await getEscolaIdServer()
  const [{ data: atletas }, { data: cobrancas }] = await Promise.all([
    supabaseAdmin.from('Atleta').select('id, nome').eq('escolaId', escolaId).eq('ativo', true),
    supabaseAdmin.from('Cobranca').select('id, valor, vencimento, status, pixCopiaCola, pixQrCode, descricao, atletaId')
      .eq('escolaId', escolaId).is('excluidaEm', null).order('vencimento', { ascending: false }).limit(500),
  ])
  return { atletas: atletas ?? [], cobrancas: cobrancas ?? [] }
}

// ── Novo atleta ───────────────────────────────────────────────────────────
export async function turmasEPlanos() {
  const escolaId = await getEscolaIdServer()
  const [{ data: turmas }, { data: planos }] = await Promise.all([
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
    supabaseAdmin.from('PlanoMensalidade').select('slug, nome, valor').eq('escolaId', escolaId).order('valor'),
  ])
  return { turmas: turmas ?? [], planos: planos ?? [] }
}
