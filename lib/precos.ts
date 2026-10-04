// Regras de preco das mensalidades (tabela TabelaPreco).
// Arquivo puro: sem acesso a banco, pode ser usado no servidor e no cliente.

export type FaixaPreco = {
  id: string
  escolaId: string
  ano: number
  nome: string
  nascidoDe: number | null   // ano de nascimento minimo (inclusive). null = sem limite
  nascidoAte: number | null  // ano de nascimento maximo (inclusive). null = sem limite
  valorMensal: number
  valorTrimestral: number | null
  valorSemestral: number | null
  valorTrimestralIrmao: number | null
  valorSemestralIrmao: number | null
  ordem: number
  ativo: boolean
}

export type TipoPlano = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL'

export const MESES_DO_PLANO: Record<TipoPlano, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
}

export const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export function anoNascimento(dataNascimento: string | Date | null | undefined): number | null {
  if (!dataNascimento) return null
  const s = typeof dataNascimento === 'string' ? dataNascimento : dataNascimento.toISOString()
  const ano = Number(s.slice(0, 4))
  return Number.isFinite(ano) && ano > 1900 ? ano : null
}

export function faixaContemAno(f: Pick<FaixaPreco, 'nascidoDe' | 'nascidoAte'>, ano: number): boolean {
  if (f.nascidoDe != null && ano < f.nascidoDe) return false
  if (f.nascidoAte != null && ano > f.nascidoAte) return false
  return true
}

/** Encontra a faixa do atleta pelo ano de nascimento. Retorna null se nenhuma faixa ativa cobrir. */
export function faixaDoAtleta(faixas: FaixaPreco[], dataNascimento: string | Date | null | undefined): FaixaPreco | null {
  const ano = anoNascimento(dataNascimento)
  if (ano == null) return null
  const ativas = faixas.filter(f => f.ativo).sort((a, b) => a.ordem - b.ordem)
  return ativas.find(f => faixaContemAno(f, ano)) ?? null
}

export type Preco = {
  plano: TipoPlano
  meses: number
  total: number          // valor cobrado de uma vez
  porMes: number         // equivalente mensal
  economia: number       // quanto economiza vs. pagar mensal pelo mesmo periodo
  comDescontoIrmao: boolean
}

/**
 * Calcula o preco de um plano para uma faixa.
 * Desconto de irmao so existe nos pacotes (trimestral/semestral); no mensal e sempre valor cheio.
 * Se o valor de irmao nao estiver preenchido, usa o valor normal do pacote.
 */
export function calcularPreco(f: FaixaPreco, plano: TipoPlano, irmao = false): Preco | null {
  const meses = MESES_DO_PLANO[plano]
  let total: number | null
  let comDescontoIrmao = false

  if (plano === 'MENSAL') {
    total = f.valorMensal
  } else if (plano === 'TRIMESTRAL') {
    total = irmao && f.valorTrimestralIrmao != null ? f.valorTrimestralIrmao : f.valorTrimestral
    comDescontoIrmao = irmao && f.valorTrimestralIrmao != null
  } else {
    total = irmao && f.valorSemestralIrmao != null ? f.valorSemestralIrmao : f.valorSemestral
    comDescontoIrmao = irmao && f.valorSemestralIrmao != null
  }

  if (total == null) return null // pacote nao oferecido nessa faixa
  const cheio = f.valorMensal * meses
  return {
    plano,
    meses,
    total: round2(total),
    porMes: round2(total / meses),
    economia: round2(Math.max(0, cheio - total)),
    comDescontoIrmao,
  }
}

export function descontoPct(f: FaixaPreco, total: number | null, meses: number): number | null {
  if (total == null || !f.valorMensal) return null
  const cheio = f.valorMensal * meses
  return Math.round((1 - total / cheio) * 1000) / 10
}

/** Valida as faixas de um ano: sobreposicao e anos de nascimento sem faixa. */
export function validarFaixas(faixas: FaixaPreco[], anosVerificar: number[] = []): string[] {
  const erros: string[] = []
  const ativas = faixas.filter(f => f.ativo)

  for (const f of ativas) {
    if (f.nascidoDe != null && f.nascidoAte != null && f.nascidoDe > f.nascidoAte) {
      erros.push(`"${f.nome}": o ano inicial (${f.nascidoDe}) é maior que o final (${f.nascidoAte}).`)
    }
    if (!(f.valorMensal > 0)) erros.push(`"${f.nome}": valor mensal precisa ser maior que zero.`)
    for (const [rotulo, v, meses] of [
      ['trimestral', f.valorTrimestral, 3],
      ['semestral', f.valorSemestral, 6],
    ] as const) {
      if (v != null && v > f.valorMensal * meses) {
        erros.push(`"${f.nome}": o ${rotulo} (${brl(v)}) está mais caro que pagar mensal (${brl(f.valorMensal * meses)}).`)
      }
    }
    if (f.valorTrimestralIrmao != null && f.valorTrimestral != null && f.valorTrimestralIrmao > f.valorTrimestral) {
      erros.push(`"${f.nome}": trimestral de irmão está mais caro que o trimestral normal.`)
    }
    if (f.valorSemestralIrmao != null && f.valorSemestral != null && f.valorSemestralIrmao > f.valorSemestral) {
      erros.push(`"${f.nome}": semestral de irmão está mais caro que o semestral normal.`)
    }
  }

  // sobreposicao entre faixas
  for (let i = 0; i < ativas.length; i++) {
    for (let j = i + 1; j < ativas.length; j++) {
      const a = ativas[i], b = ativas[j]
      const aDe = a.nascidoDe ?? -Infinity, aAte = a.nascidoAte ?? Infinity
      const bDe = b.nascidoDe ?? -Infinity, bAte = b.nascidoAte ?? Infinity
      if (aDe <= bAte && bDe <= aAte) {
        erros.push(`As faixas "${a.nome}" e "${b.nome}" se sobrepõem (o mesmo ano de nascimento cai nas duas).`)
      }
    }
  }

  // anos de nascimento de atletas reais sem faixa
  const semFaixa = [...new Set(anosVerificar)].filter(ano => !ativas.some(f => faixaContemAno(f, ano))).sort()
  if (semFaixa.length) erros.push(`Nenhuma faixa cobre atletas nascidos em: ${semFaixa.join(', ')}.`)

  return erros
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
