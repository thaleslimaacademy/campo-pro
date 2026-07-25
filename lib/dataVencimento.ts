/**
 * Calcula a data de vencimento real para um mes especifico, respeitando o
 * dia preferido do atleta (1-31) sem nunca estourar pro mes seguinte.
 *
 * new Date(ano, mes, dia) do JS rola em silencio quando o dia nao existe
 * naquele mes (dia 31 de abril vira 1 de maio) — foi por isso que o sistema
 * travava tudo em 28 antes. A correcao certa e usar o ULTIMO DIA REAL do mes
 * quando o preferido estourar: dia 31 cai em 30 em abril/junho/setembro/
 * novembro, e em 28 (ou 29 em ano bissexto) em fevereiro.
 *
 * `new Date(Date.UTC(ano, mesIndex0 + 1, 0))` e o truque padrao pra pegar o
 * ultimo dia de um mes: dia 0 do mes seguinte = ultimo dia do mes atual.
 */
export function dataVencimentoNoMes(ano: number, mesIndex0: number, diaPreferido: number): string {
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mesIndex0 + 1, 0)).getUTCDate()
  const dia = Math.min(Math.max(1, diaPreferido || 10), ultimoDiaDoMes)
  return new Date(Date.UTC(ano, mesIndex0, dia)).toISOString().slice(0, 10)
}

/** Clamp de sanidade pra salvar a PREFERENCIA do atleta (1-31, nunca o calculo do mes). */
export function clampDiaPreferido(dia: number | null | undefined): number {
  const n = Number(dia) || 10
  return Math.min(Math.max(1, n), 31)
}
