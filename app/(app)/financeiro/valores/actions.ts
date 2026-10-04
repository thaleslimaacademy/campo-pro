'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { requireFinanceiro } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { type FaixaPreco, anoNascimento, faixaDoAtleta, validarFaixas } from '@/lib/precos'

type Resultado = { ok: true } | { ok: false; erro: string }

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v))

function normalizar(r: Record<string, unknown>): FaixaPreco {
  return {
    id: String(r.id),
    escolaId: String(r.escolaId),
    ano: Number(r.ano),
    nome: String(r.nome),
    nascidoDe: num(r.nascidoDe),
    nascidoAte: num(r.nascidoAte),
    valorMensal: Number(r.valorMensal),
    valorTrimestral: num(r.valorTrimestral),
    valorSemestral: num(r.valorSemestral),
    valorTrimestralIrmao: num(r.valorTrimestralIrmao),
    valorSemestralIrmao: num(r.valorSemestralIrmao),
    ordem: Number(r.ordem ?? 0),
    ativo: Boolean(r.ativo),
  }
}

export type RegrasEscola = {
  multaAtraso: number
  jurosAoMes: number
  prazoCancelamentoDias: number
  validadeCreditoMeses: number
}

export type ResumoValores = {
  ano: number
  anosDisponiveis: number[]
  faixas: FaixaPreco[]
  regras: RegrasEscola
  atletasPorFaixa: Record<string, number>
  atletasSemFaixa: { id: string; nome: string; dataNascimento: string | null }[]
  receitaMensalEstimada: number
  avisos: string[]
}

export async function carregarValores(ano: number): Promise<ResumoValores> {
  const { escolaId } = await requireFinanceiro()

  const [{ data: faixasRaw }, { data: anosRaw }, { data: escola }, { data: atletas }] = await Promise.all([
    supabaseAdmin.from('TabelaPreco').select('*').eq('escolaId', escolaId).eq('ano', ano).order('ordem'),
    supabaseAdmin.from('TabelaPreco').select('ano').eq('escolaId', escolaId),
    supabaseAdmin.from('Escola')
      .select('multaAtraso, jurosAoMes, prazoCancelamentoDias, validadeCreditoMeses')
      .eq('id', escolaId).single(),
    supabaseAdmin.from('Atleta').select('id, nome, dataNascimento').eq('escolaId', escolaId).eq('ativo', true),
  ])

  const faixas = (faixasRaw ?? []).map(normalizar)
  const lista = (atletas ?? []) as { id: string; nome: string; dataNascimento: string | null }[]

  const atletasPorFaixa: Record<string, number> = {}
  const atletasSemFaixa: ResumoValores['atletasSemFaixa'] = []
  let receita = 0
  const anoAtual = new Date().getFullYear()

  for (const a of lista) {
    const f = faixaDoAtleta(faixas, a.dataNascimento)
    const anoNasc = anoNascimento(a.dataNascimento)
    // data no futuro ou absurda = cadastro errado, mostra para corrigir
    if (!f || anoNasc == null || anoNasc > anoAtual) {
      atletasSemFaixa.push(a)
      continue
    }
    atletasPorFaixa[f.id] = (atletasPorFaixa[f.id] ?? 0) + 1
    receita += f.valorMensal
  }

  const anos = [...new Set([...(anosRaw ?? []).map((r: { ano: number }) => r.ano), ano])].sort()
  const avisos = faixas.length ? validarFaixas(faixas) : []

  return {
    ano,
    anosDisponiveis: anos,
    faixas,
    regras: {
      multaAtraso: Number(escola?.multaAtraso ?? 2),
      jurosAoMes: Number(escola?.jurosAoMes ?? 1),
      prazoCancelamentoDias: Number(escola?.prazoCancelamentoDias ?? 31),
      validadeCreditoMeses: Number(escola?.validadeCreditoMeses ?? 12),
    },
    atletasPorFaixa,
    atletasSemFaixa,
    receitaMensalEstimada: Math.round(receita * 100) / 100,
    avisos,
  }
}

export type FaixaInput = Omit<FaixaPreco, 'id' | 'escolaId' | 'ativo' | 'ordem'> & { id?: string; ordem?: number }

export async function salvarFaixa(input: FaixaInput): Promise<Resultado> {
  try {
    const { escolaId } = await requireFinanceiro()
    const nome = (input.nome || '').trim()
    if (!nome) return { ok: false, erro: 'Dê um nome para a faixa.' }
    if (!(Number(input.valorMensal) > 0)) return { ok: false, erro: 'O valor mensal precisa ser maior que zero.' }
    if (!(input.ano >= 2024 && input.ano <= 2100)) return { ok: false, erro: 'Ano inválido.' }

    const linha = {
      escolaId,
      ano: input.ano,
      nome,
      nascidoDe: num(input.nascidoDe),
      nascidoAte: num(input.nascidoAte),
      valorMensal: Number(input.valorMensal),
      valorTrimestral: num(input.valorTrimestral),
      valorSemestral: num(input.valorSemestral),
      valorTrimestralIrmao: num(input.valorTrimestralIrmao),
      valorSemestralIrmao: num(input.valorSemestralIrmao),
      updatedAt: new Date().toISOString(),
    }

    // valida junto com as outras faixas do mesmo ano antes de gravar
    const { data: outras } = await supabaseAdmin.from('TabelaPreco').select('*')
      .eq('escolaId', escolaId).eq('ano', input.ano).eq('ativo', true)
    const simulado = (outras ?? []).map(normalizar).filter(f => f.id !== input.id)
    simulado.push({ ...linha, id: input.id ?? 'nova', ordem: input.ordem ?? 99, ativo: true })
    const erros = validarFaixas(simulado)
    if (erros.length) return { ok: false, erro: erros[0] }

    if (input.id) {
      const { data, error } = await supabaseAdmin.from('TabelaPreco').update(linha)
        .eq('id', input.id).eq('escolaId', escolaId).select('id')
      if (error) return { ok: false, erro: error.message }
      if (!data?.length) return { ok: false, erro: 'Faixa não encontrada.' }
    } else {
      const ordem = input.ordem ?? ((outras ?? []).length + 1)
      const { error } = await supabaseAdmin.from('TabelaPreco').insert({ ...linha, ordem })
      if (error) return { ok: false, erro: error.message }
    }

    revalidatePath('/financeiro/valores')
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}

export async function excluirFaixa(id: string): Promise<Resultado> {
  try {
    const { escolaId } = await requireFinanceiro()
    // desativa em vez de apagar: preserva o historico de precos
    const { data, error } = await supabaseAdmin.from('TabelaPreco')
      .update({ ativo: false, updatedAt: new Date().toISOString() })
      .eq('id', id).eq('escolaId', escolaId).select('id')
    if (error) return { ok: false, erro: error.message }
    if (!data?.length) return { ok: false, erro: 'Faixa não encontrada.' }
    revalidatePath('/financeiro/valores')
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}

/** Copia as faixas de um ano para o seguinte, avancando os anos de nascimento em +1 (mesma idade). */
export async function copiarParaAno(anoOrigem: number, anoDestino: number): Promise<Resultado> {
  try {
    const { escolaId } = await requireFinanceiro()
    const { data: existe } = await supabaseAdmin.from('TabelaPreco').select('id')
      .eq('escolaId', escolaId).eq('ano', anoDestino).eq('ativo', true).limit(1)
    if (existe?.length) return { ok: false, erro: `Já existem faixas em ${anoDestino}.` }

    const { data: origem } = await supabaseAdmin.from('TabelaPreco').select('*')
      .eq('escolaId', escolaId).eq('ano', anoOrigem).eq('ativo', true)
    if (!origem?.length) return { ok: false, erro: `Não há faixas em ${anoOrigem} para copiar.` }

    const delta = anoDestino - anoOrigem
    const novas = origem.map(normalizar).map(f => ({
      escolaId,
      ano: anoDestino,
      nome: f.nome,
      nascidoDe: f.nascidoDe != null ? f.nascidoDe + delta : null,
      nascidoAte: f.nascidoAte != null ? f.nascidoAte + delta : null,
      valorMensal: f.valorMensal,
      valorTrimestral: f.valorTrimestral,
      valorSemestral: f.valorSemestral,
      valorTrimestralIrmao: f.valorTrimestralIrmao,
      valorSemestralIrmao: f.valorSemestralIrmao,
      ordem: f.ordem,
    }))
    const { error } = await supabaseAdmin.from('TabelaPreco').insert(novas)
    if (error) return { ok: false, erro: error.message }
    revalidatePath('/financeiro/valores')
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}

export async function salvarRegras(regras: RegrasEscola): Promise<Resultado> {
  try {
    const { escolaId } = await requireFinanceiro()
    const multa = Number(regras.multaAtraso)
    const juros = Number(regras.jurosAoMes)
    const prazo = Math.round(Number(regras.prazoCancelamentoDias))
    const validade = Math.round(Number(regras.validadeCreditoMeses))

    // limites do Codigo de Defesa do Consumidor (multa ate 2%; juros de 1% ao mes e o usual)
    if (!(multa >= 0 && multa <= 2)) return { ok: false, erro: 'A multa por atraso deve ficar entre 0% e 2% (limite do Código de Defesa do Consumidor).' }
    if (!(juros >= 0 && juros <= 1)) return { ok: false, erro: 'Os juros devem ficar entre 0% e 1% ao mês.' }
    if (!(prazo >= 7 && prazo <= 90)) return { ok: false, erro: 'O prazo de cancelamento deve ficar entre 7 e 90 dias (a lei garante no mínimo 7).' }
    if (!(validade >= 1 && validade <= 36)) return { ok: false, erro: 'A validade do crédito deve ficar entre 1 e 36 meses.' }

    const { data, error } = await supabaseAdmin.from('Escola').update({
      multaAtraso: multa,
      jurosAoMes: juros,
      prazoCancelamentoDias: prazo,
      validadeCreditoMeses: validade,
    }).eq('id', escolaId).select('id')
    if (error) return { ok: false, erro: error.message }
    if (!data?.length) return { ok: false, erro: 'Escola não encontrada.' }

    revalidatePath('/financeiro/valores')
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}
