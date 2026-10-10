'use server'
/**
 * Gestao Financeira: tudo num lugar so (substitui Caixa e Painel financeiro).
 * Entradas automaticas: mensalidades pagas, loja, fotos e patrocinios recebidos.
 * Saidas: despesas fixas (repetem todo mes), variaveis e cartao de credito.
 * Sempre por escola (a da sessao). So admin/diretor.
 */
import { supabaseAdmin } from '@/lib/supabase'
import { requireFinanceiro } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

type R<T = unknown> = { ok: true; data?: T } | { ok: false; erro: string }
const MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function limitesMes(mes: string) {
  const [a, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  return { a, m, inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, '0')}`, ultimo }
}
function somaMes(mes: string, n: number) {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const mesDe = (d: string | null | undefined) => (d ? String(d).slice(0, 7) : '')
const num = (v: unknown) => Number(v ?? 0) || 0
const r2 = (v: number) => Math.round(v * 100) / 100
function validarMes(mes: string) {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error('Mês inválido.')
}

/** Cria (uma vez) as despesas fixas do mes a partir dos modelos ativos. */
async function gerarFixasDoMes(escolaId: string, mes: string) {
  const { data: fixas } = await supabaseAdmin.from('DespesaFixa').select('id, descricao, categoria, valor, diaVencimento, criadoEm')
    .eq('escolaId', escolaId).eq('ativa', true)
  const { fim } = limitesMes(mes)
  const linhas = ((fixas ?? []) as { id: string; descricao: string; categoria: string | null; valor: number; diaVencimento: number; criadoEm: string }[])
    .filter(f => mesDe(f.criadoEm) <= mes) // nao cria para meses anteriores ao cadastro
    .map(f => ({
      escolaId, descricao: f.descricao, categoria: f.categoria, valor: f.valor, tipo: 'FIXA',
      despesaFixaId: f.id, pago: false, data: `${mes}-${String(Math.min(f.diaVencimento, Number(fim.slice(8)))).padStart(2, '0')}`,
    }))
  if (linhas.length) {
    await supabaseAdmin.from('Despesa').upsert(linhas, { onConflict: 'despesaFixaId,data', ignoreDuplicates: true })
  }
}

export type Lanc = { id: string; descricao: string | null; categoria: string | null; valor: number; data: string; tipo?: string; pago?: boolean; parcelaAtual?: number | null; parcelas?: number | null; grupoId?: string | null; despesaFixaId?: string | null }

export async function carregarGestao(mes: string) {
  validarMes(mes)
  const { escolaId } = await requireFinanceiro()
  const hoje = new Date().toISOString().slice(0, 7)
  if (mes <= somaMes(hoje, 1)) await gerarFixasDoMes(escolaId, mes)

  const ini6 = somaMes(mes, -5)
  const { inicio: i6 } = limitesMes(ini6)
  const { inicio, fim } = limitesMes(mes)
  const ate = `${fim}T23:59:59`

  const [cobr, pedidos, fotos, receitas, despesas, fixas, escola, aReceber, patros] = await Promise.all([
    supabaseAdmin.from('Cobranca').select('id, valor, valorPago, pagoEm, familiaId, familiaCobrancaId')
      .eq('escolaId', escolaId).eq('status', 'PAGO').is('excluidaEm', null).gte('pagoEm', `${i6}T00:00:00`).lte('pagoEm', ate),
    supabaseAdmin.from('Pedido').select('valor, pagoEm').eq('escolaId', escolaId).eq('status', 'PAGO').gte('pagoEm', `${i6}T00:00:00`).lte('pagoEm', ate),
    supabaseAdmin.from('FotoCompra').select('valor, pagoEm').eq('escolaId', escolaId).eq('status', 'PAGO').gte('pagoEm', `${i6}T00:00:00`).lte('pagoEm', ate),
    supabaseAdmin.from('Receita').select('id, valor, descricao, categoria, data, patrocinadorId').eq('escolaId', escolaId).gte('data', i6).lte('data', fim).order('data'),
    supabaseAdmin.from('Despesa').select('id, valor, descricao, categoria, data, tipo, pago, parcelaAtual, parcelas, grupoId, despesaFixaId').eq('escolaId', escolaId).gte('data', i6).lte('data', fim).order('data'),
    supabaseAdmin.from('DespesaFixa').select('id, descricao, categoria, valor, diaVencimento').eq('escolaId', escolaId).eq('ativa', true).order('diaVencimento'),
    supabaseAdmin.from('Escola').select('cartaoLimite, cartaoFechamento, cartaoVencimento').eq('id', escolaId).maybeSingle(),
    supabaseAdmin.from('Cobranca').select('id, valor, familiaCobrancaId').eq('escolaId', escolaId).in('status', ['PENDENTE', 'VENCIDO'])
      .is('excluidaEm', null).gte('vencimento', inicio).lte('vencimento', ate),
    supabaseAdmin.from('Patrocinador').select('id, nome, empresa, valor, vencimento, status').eq('escolaId', escolaId),
  ])

  // mensalidades: conta o dinheiro que entrou. Pix da familia pago -> conta a
  // linha da familia e ignora as fichas dos filhos (senao entra em dobro).
  const cobs = (cobr.data ?? []) as { id: string; valor: number; valorPago: number | null; pagoEm: string; familiaId: string | null; familiaCobrancaId: string | null }[]
  const familiasPagas = new Set(cobs.filter(c => c.familiaId).map(c => c.id))
  const mensal = cobs.filter(c => !(c.familiaCobrancaId && familiasPagas.has(c.familiaCobrancaId)))

  const meses = Array.from({ length: 6 }, (_, i) => somaMes(ini6, i))
  const vazio = () => ({ mensalidades: 0, loja: 0, patrocinios: 0, outras: 0, fixa: 0, variavel: 0, cartao: 0, aPagar: 0 })
  const b: Record<string, ReturnType<typeof vazio>> = Object.fromEntries(meses.map(m => [m, vazio()]))
  for (const c of mensal) { const k = mesDe(c.pagoEm); if (b[k]) b[k].mensalidades += num(c.valorPago ?? c.valor) }
  for (const p of [...(pedidos.data ?? []), ...(fotos.data ?? [])] as { valor: number; pagoEm: string }[]) { const k = mesDe(p.pagoEm); if (b[k]) b[k].loja += num(p.valor) }
  const recs = (receitas.data ?? []) as (Lanc & { patrocinadorId: string | null })[]
  for (const r of recs) { const k = mesDe(r.data); if (!b[k]) continue; if (r.categoria === 'PATROCINIO') b[k].patrocinios += num(r.valor); else b[k].outras += num(r.valor) }
  const desps = (despesas.data ?? []) as Lanc[]
  for (const d of desps) {
    const k = mesDe(d.data); if (!b[k]) continue
    if (d.pago === false) { b[k].aPagar += num(d.valor); continue }
    if (d.tipo === 'FIXA') b[k].fixa += num(d.valor)
    else if (d.tipo === 'CARTAO') b[k].cartao += num(d.valor)
    else b[k].variavel += num(d.valor)
  }

  const cur = b[mes]
  const entrou = cur.mensalidades + cur.loja + cur.patrocinios + cur.outras
  const saiu = cur.fixa + cur.variavel + cur.cartao
  const pend = ((aReceber.data ?? []) as { valor: number; familiaCobrancaId: string | null }[]).filter(c => !c.familiaCobrancaId)

  const doMes = desps.filter(d => mesDe(d.data) === mes)
  const e = (escola.data ?? {}) as { cartaoLimite: number | null; cartaoFechamento: number | null; cartaoVencimento: number | null }
  const cartaoMes = doMes.filter(d => d.tipo === 'CARTAO')

  const patrocinadores = ((patros.data ?? []) as { id: string; nome: string; empresa: string | null; valor: number; vencimento: string | null; status: string | null }[])
    .filter(p => (p.status || '').toUpperCase() !== 'INATIVO' && (p.status || '').toUpperCase() !== 'CANCELADO')
  const recebidosMes = new Set(recs.filter(r => mesDe(r.data) === mes && r.patrocinadorId).map(r => r.patrocinadorId))

  return {
    mes,
    kpis: {
      entrou: r2(entrou), saiu: r2(saiu), saldo: r2(entrou - saiu), aPagar: r2(cur.aPagar),
      aReceber: r2(pend.reduce((s, c) => s + num(c.valor), 0)), aReceberQtd: pend.length,
      qtdMensalidades: mensal.filter(c => mesDe(c.pagoEm) === mes).length,
    },
    serie: meses.map(m => {
      const x = b[m]; const [, mm] = m.split('-').map(Number)
      return { mes: m, rotulo: MES_CURTO[mm - 1], entradas: r2(x.mensalidades + x.loja + x.patrocinios + x.outras), saidas: r2(x.fixa + x.variavel + x.cartao) }
    }),
    porTipo: { fixa: r2(cur.fixa), variavel: r2(cur.variavel), cartao: r2(cur.cartao) },
    origens: { mensalidades: r2(cur.mensalidades), patrocinios: r2(cur.patrocinios), loja: r2(cur.loja), outras: r2(cur.outras) },
    fixasMes: doMes.filter(d => d.tipo === 'FIXA'),
    modelosFixos: (fixas.data ?? []) as { id: string; descricao: string; categoria: string | null; valor: number; diaVencimento: number }[],
    variaveis: doMes.filter(d => d.tipo !== 'FIXA' && d.tipo !== 'CARTAO'),
    entradasManuais: recs.filter(r => mesDe(r.data) === mes),
    cartao: {
      limite: e.cartaoLimite ?? null, fechamento: e.cartaoFechamento ?? null, vencimento: e.cartaoVencimento ?? null,
      usado: r2(cartaoMes.reduce((s, d) => s + num(d.valor), 0)), compras: cartaoMes,
    },
    patrocinadores: patrocinadores.map(p => ({ ...p, recebidoNoMes: recebidosMes.has(p.id) })),
  }
}

// ── Lancamentos ───────────────────────────────────────────────────────────
function validarValor(v: number) { return Number.isFinite(v) && v > 0 && v < 1_000_000 }
function validarData(d: string) { return /^\d{4}-\d{2}-\d{2}$/.test(d) }
const atualizar = () => revalidatePath('/financeiro/gestao')

export async function lancarEntrada(p: { valor: number; descricao: string; categoria?: string; data: string }): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  if (!validarValor(p.valor) || !validarData(p.data) || !p.descricao?.trim()) return { ok: false, erro: 'Preencha descrição, valor e data.' }
  const { error } = await supabaseAdmin.from('Receita').insert({ escolaId, valor: p.valor, descricao: p.descricao.trim(), categoria: (p.categoria || 'OUTRA').toUpperCase(), data: p.data })
  if (error) return { ok: false, erro: error.message }
  atualizar(); return { ok: true }
}

export async function lancarDespesaVariavel(p: { valor: number; descricao: string; categoria?: string; data: string }): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  if (!validarValor(p.valor) || !validarData(p.data) || !p.descricao?.trim()) return { ok: false, erro: 'Preencha descrição, valor e data.' }
  const { error } = await supabaseAdmin.from('Despesa').insert({ escolaId, valor: p.valor, descricao: p.descricao.trim(), categoria: p.categoria || null, data: p.data, tipo: 'VARIAVEL', pago: true })
  if (error) return { ok: false, erro: error.message }
  atualizar(); return { ok: true }
}

export async function criarDespesaFixa(p: { valor: number; descricao: string; categoria?: string; diaVencimento: number }): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  const dia = Math.round(Number(p.diaVencimento))
  if (!validarValor(p.valor) || !p.descricao?.trim() || !(dia >= 1 && dia <= 28)) return { ok: false, erro: 'Preencha descrição, valor e dia (1 a 28).' }
  const { error } = await supabaseAdmin.from('DespesaFixa').insert({ escolaId, valor: p.valor, descricao: p.descricao.trim(), categoria: p.categoria || null, diaVencimento: dia })
  if (error) return { ok: false, erro: error.message }
  await gerarFixasDoMes(escolaId, new Date().toISOString().slice(0, 7))
  atualizar(); return { ok: true }
}

/** Para de repetir nos proximos meses (o historico fica). */
export async function encerrarDespesaFixa(fixaId: string): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  const { error } = await supabaseAdmin.from('DespesaFixa').update({ ativa: false }).eq('id', fixaId).eq('escolaId', escolaId)
  if (error) return { ok: false, erro: error.message }
  // remove as ocorrencias futuras ainda nao pagas
  const mesQueVem = new Date(); mesQueVem.setUTCMonth(mesQueVem.getUTCMonth() + 1, 1)
  await supabaseAdmin.from('Despesa').delete().eq('escolaId', escolaId).eq('despesaFixaId', fixaId).eq('pago', false).gte('data', mesQueVem.toISOString().slice(0, 10))
  atualizar(); return { ok: true }
}

export async function marcarDespesaPaga(despesaId: string, pago: boolean): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  const { error } = await supabaseAdmin.from('Despesa').update({ pago }).eq('id', despesaId).eq('escolaId', escolaId)
  if (error) return { ok: false, erro: error.message }
  atualizar(); return { ok: true }
}

/**
 * Compra no cartao: divide em parcelas, cada uma na fatura do seu mes.
 * Compra depois do dia de fechamento cai na fatura do mes seguinte.
 */
export async function lancarCompraCartao(p: { valor: number; descricao: string; data: string; parcelas: number }): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  const n = Math.round(Number(p.parcelas) || 1)
  if (!validarValor(p.valor) || !validarData(p.data) || !p.descricao?.trim() || !(n >= 1 && n <= 24)) return { ok: false, erro: 'Preencha descrição, valor, data e parcelas (1 a 24).' }
  const { data: e } = await supabaseAdmin.from('Escola').select('cartaoFechamento').eq('id', escolaId).maybeSingle()
  const fechamento = Number(e?.cartaoFechamento) || 31
  const diaCompra = Number(p.data.slice(8, 10))
  const primeiraFatura = diaCompra > fechamento ? somaMes(p.data.slice(0, 7), 1) : p.data.slice(0, 7)
  const grupoId = crypto.randomUUID()
  const valorParcela = Math.floor((p.valor / n) * 100) / 100
  const resto = r2(p.valor - valorParcela * n)
  const linhas = Array.from({ length: n }, (_, i) => ({
    escolaId, tipo: 'CARTAO', pago: true, grupoId, parcelaAtual: i + 1, parcelas: n,
    descricao: p.descricao.trim(), categoria: 'CARTAO',
    valor: r2(valorParcela + (i === 0 ? resto : 0)),
    data: `${somaMes(primeiraFatura, i)}-01`,
  }))
  const { error } = await supabaseAdmin.from('Despesa').insert(linhas)
  if (error) return { ok: false, erro: error.message }
  atualizar(); return { ok: true }
}

export async function salvarCartao(p: { limite: number | null; fechamento: number | null; vencimento: number | null }): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  const dia = (d: number | null) => (d == null ? null : Math.min(31, Math.max(1, Math.round(d))))
  const { error } = await supabaseAdmin.from('Escola').update({
    cartaoLimite: p.limite != null && p.limite > 0 ? p.limite : null, cartaoFechamento: dia(p.fechamento), cartaoVencimento: dia(p.vencimento),
  }).eq('id', escolaId)
  if (error) return { ok: false, erro: error.message }
  atualizar(); return { ok: true }
}

/** Patrocinio recebido: vira entrada e o vencimento do patrocinador anda 1 mes. */
export async function receberPatrocinio(patrocinadorId: string, mes: string): Promise<R> {
  validarMes(mes)
  const { escolaId } = await requireFinanceiro()
  const { data: p } = await supabaseAdmin.from('Patrocinador').select('id, nome, empresa, valor, vencimento').eq('id', patrocinadorId).eq('escolaId', escolaId).maybeSingle()
  if (!p) return { ok: false, erro: 'Patrocinador não encontrado.' }
  const hoje = new Date().toISOString().slice(0, 10)
  const data = mesDe(hoje) === mes ? hoje : `${mes}-01`
  const { error } = await supabaseAdmin.from('Receita').insert({ escolaId, valor: p.valor, descricao: `Patrocínio — ${p.empresa || p.nome}`, categoria: 'PATROCINIO', data, patrocinadorId: p.id })
  if (error) return { ok: false, erro: error.message }
  if (p.vencimento) {
    const v = new Date(String(p.vencimento).slice(0, 10) + 'T12:00:00Z'); v.setUTCMonth(v.getUTCMonth() + 1)
    await supabaseAdmin.from('Patrocinador').update({ vencimento: v.toISOString().slice(0, 10) }).eq('id', p.id)
  }
  atualizar(); return { ok: true }
}

export async function excluirLancamento(tipo: 'entrada' | 'despesa' | 'compra', id: string): Promise<R> {
  const { escolaId } = await requireFinanceiro()
  const q = tipo === 'entrada'
    ? supabaseAdmin.from('Receita').delete().eq('id', id)
    : tipo === 'compra'
      ? supabaseAdmin.from('Despesa').delete().eq('grupoId', id)
      : supabaseAdmin.from('Despesa').delete().eq('id', id)
  const { error } = await q.eq('escolaId', escolaId)
  if (error) return { ok: false, erro: error.message }
  atualizar(); return { ok: true }
}

/** Lembrete: quantos dias sem lancar despesa (desconsidera as fixas automaticas). */
export async function diasSemLancarDespesa(): Promise<number | null> {
  const { escolaId } = await requireFinanceiro()
  const { data } = await supabaseAdmin.from('Despesa').select('createdAt').eq('escolaId', escolaId)
    .is('despesaFixaId', null).order('createdAt', { ascending: false }).limit(1).maybeSingle()
  if (!data?.createdAt) return 999
  return Math.floor((Date.now() - new Date(String(data.createdAt) + (String(data.createdAt).endsWith('Z') ? '' : 'Z')).getTime()) / 86400000)
}
