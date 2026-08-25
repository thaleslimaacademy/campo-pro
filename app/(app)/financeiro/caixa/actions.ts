'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'

type LinhaCobranca = {
  id: string
  atletaId: string | null
  valor: number
  competencia: string | null
  descricao: string | null
  pagoEm: string | null
  familiaId: string | null
  familiaCobrancaId: string | null
}

export async function carregarCaixa(mes: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const [anoStr, mesStr] = mes.split('-')
  const ano = Number(anoStr), m = Number(mesStr)
  const inicio = `${mes}-01`
  const fim = `${mes}-${String(new Date(ano, m, 0).getDate()).padStart(2,'0')}`

  const COLUNAS = 'id, atletaId, valor, competencia, descricao, pagoEm, familiaId, familiaCobrancaId'

  // 25/08/2026 — o caixa buscava SO por competencia. Cobranca paga com
  // competencia nula (avulsas, taxas, e as criadas por fluxos antigos) nunca
  // aparecia em mes nenhum: dinheiro que entrou e sumiu do relatorio. Agora
  // sao duas buscas — pela competencia, e pela data do pagamento quando a
  // competencia esta vazia. Tambem passou a ignorar cobranca excluida.
  const [{ data: porCompetencia }, { data: porPagamento }, { data: atl }, { data: rec }, { data: desp }] = await Promise.all([
    supabaseAdmin.from('Cobranca').select(COLUNAS)
      .eq('escolaId', ESCOLA_ID).eq('status', 'PAGO').is('excluidaEm', null)
      .gte('competencia', inicio).lte('competencia', fim),
    supabaseAdmin.from('Cobranca').select(COLUNAS)
      .eq('escolaId', ESCOLA_ID).eq('status', 'PAGO').is('excluidaEm', null)
      .is('competencia', null)
      .gte('pagoEm', `${inicio}T00:00:00`).lte('pagoEm', `${fim}T23:59:59`),
    supabaseAdmin.from('Atleta').select('id, nome').eq('escolaId', ESCOLA_ID),
    supabaseAdmin.from('Receita').select('id, valor, descricao, categoria, data')
      .eq('escolaId', ESCOLA_ID).gte('data', inicio).lte('data', fim).order('data'),
    supabaseAdmin.from('Despesa').select('id, valor, descricao, categoria, data')
      .eq('escolaId', ESCOLA_ID).gte('data', inicio).lte('data', fim).order('data'),
  ])

  // Junta as duas buscas sem repetir (as consultas sao exclusivas entre si,
  // mas o dedupe protege se alguem afrouxar um dos filtros depois).
  const porId = new Map<string, LinhaCobranca>()
  for (const c of [...(porCompetencia ?? []), ...(porPagamento ?? [])] as LinhaCobranca[]) {
    porId.set(c.id, c)
  }

  // Cobranca de irmaos tem duas camadas: a linha da familia (o PIX unico que
  // o pai paga) e uma linha por filho apontando pra ela. Aqui contamos o
  // dinheiro que ENTROU, entao a regra e por pagamento, nao por camada:
  //   - pai pagou o PIX da familia  -> conta a linha da familia, descarta as
  //     dos filhos (senao o mesmo dinheiro entra duas vezes);
  //   - filhos foram pagos separado -> conta as linhas dos filhos.
  // Foi o caso de agosto/2026: R$160 entraram como dois PIX de R$80.
  const familiasPagas = new Set(
    [...porId.values()].filter(c => c.familiaId).map(c => c.id)
  )
  const linhas = [...porId.values()].filter(c =>
    !(c.familiaCobrancaId && familiasPagas.has(c.familiaCobrancaId))
  )

  const mapa = new Map((atl ?? []).map((a: { id: string; nome: string }) => [a.id, a.nome]))
  const mensalidades = linhas
    .sort((a, b) => String(a.pagoEm ?? '').localeCompare(String(b.pagoEm ?? '')))
    .map(c => ({ ...c, nome: mapa.get(c.atletaId as string) ?? '—' }))

  return { mensalidades, receitas: rec ?? [], despesas: desp ?? [] }
}
export async function criarReceita(p: { valor: number; descricao: string;categoria: string; data: string }) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Receita').insert({ escolaId: ESCOLA_ID, ...p })
  if (error) throw new Error(error.message)
  return { ok: true }
}
export async function excluirReceita(id: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Receita').delete().eq('id',id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}
export async function criarDespesa(p: { valor: number; descricao: string;categoria: string; data: string }) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Despesa').insert({ escolaId: ESCOLA_ID, ...p })
  if (error) throw new Error(error.message)
  return { ok: true }
}
export async function excluirDespesa(id: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Despesa').delete().eq('id',id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}
