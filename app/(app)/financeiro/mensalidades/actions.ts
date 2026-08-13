'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { dataVencimentoNoMes } from '@/lib/dataVencimento'
import { cancelarPixDaCobranca, CAMPOS_PIX_LIMPOS } from '@/lib/cancelarPixDaCobranca'

export async function getMensalidades() {
  const escolaId = await getEscolaIdServer()
  const [atletasRes, planosRes, cobrancasRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('id, nome, diaVencimento, planoMensalidade, valorMensalidade, bolsista, ativo').eq('escolaId', escolaId).eq('ativo', true).order('nome'),
    supabaseAdmin.from('PlanoMensalidade').select('slug, nome, valor').eq('escolaId', escolaId),
    supabaseAdmin.from('Cobranca').select('id, atletaId, valor, vencimento, status, descricao, periodo, baixaManual, tipo, pagoEm').eq('escolaId', escolaId).order('vencimento', { ascending: false }).limit(200),
  ])
  return {
    escolaId,
    atletas: atletasRes.data ?? [],
    planos: planosRes.data ?? [],
    cobrancas: cobrancasRes.data ?? [],
  }
}

export async function alterarDiaVencimentoAtleta(atletaId: string, dia: number) {
  await supabaseAdmin.from('Atleta').update({ diaVencimento: dia }).eq('id', atletaId)
  revalidatePath('/financeiro/mensalidades')
}

export async function alterarDiaVencimentoMassa(atletaIds: string[], dia: number) {
  await supabaseAdmin.from('Atleta').update({ diaVencimento: dia }).in('id', atletaIds)
  revalidatePath('/financeiro/mensalidades')
}

/**
 * Baixa manual: o dinheiro entrou por fora (dinheiro, transferencia, cartao
 * na maquininha). Cancela o PIX no Asaas pra ninguem pagar duas vezes.
 * Se o Asaas falhar, a baixa acontece do mesmo jeito — o dinheiro ja entrou,
 * segurar a baixa nao ajuda — mas devolve um aviso pra tela mostrar.
 */
export async function baixaManualCobranca(cobrancaId: string, valorPago: number, formaPagamento: string) {
  const pix = await cancelarPixDaCobranca(cobrancaId)

  const { error } = await supabaseAdmin.from('Cobranca').update({
    status: 'PAGO',
    pagoEm: new Date().toISOString(),
    valorPago,
    baixaManual: true,
    baixaManualEm: new Date().toISOString(),
    tipo: formaPagamento,
    ...(pix.ok ? CAMPOS_PIX_LIMPOS : {}),
  }).eq('id', cobrancaId)

  if (error) throw new Error('Erro ao dar baixa: ' + error.message)
  revalidatePath('/financeiro/mensalidades')

  return pix.ok
    ? { ok: true as const }
    : { ok: true as const, aviso: `Baixa registrada, mas o PIX continua ativo no Asaas (${pix.erro}). Cancele o codigo la pra evitar pagamento duplicado.` }
}

/** Alias historico — a pagina chama este nome em alguns lugares. */
export async function cancelarCobranca(cobrancaId: string) {
  return softDeleteCobranca(cobrancaId)
}

// ── Aliases e funções legadas usadas pela página existente ──
export async function listarMensalidades(opts?: { status?: string; incluirExcluidas?: boolean }) {
  const escolaId = await getEscolaIdServer()
  let q = supabaseAdmin.from('Cobranca').select('id, atletaId, atletaNome, valor, valorPago, vencimento, status, descricao, periodo, baixaManual, tipo, pagoEm, excluidaEm, grupoCobrancaId, qtdParcelas, parcelaAtual, pixCopiaCola, pixQrCode').eq('escolaId', escolaId).order('vencimento', { ascending: false }).limit(300)
  if (opts?.status && opts.status !== 'TODOS') q = q.eq('status', opts.status)
  if (!opts?.incluirExcluidas) q = q.is('excluidaEm', null)
  const { data } = await q
  // Adapta formato: competencia = vencimento, atleta = { nome: atletaNome }
  return (data ?? []).map(c => ({
    ...c,
    competencia: c.vencimento,
    atleta: c.atletaNome ? { nome: c.atletaNome } : null,
    pixCopiaCola: c.pixCopiaCola ?? null,
    pixQrCode: c.pixQrCode ?? null,
  }))
}

export async function listarAtletas() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Atleta').select('id, nome, diaVencimento, planoMensalidade, valorMensalidade, bolsista').eq('escolaId', escolaId).eq('ativo', true).order('nome')
  return data ?? []
}

export async function gerarMensalidades(params: { atletaId?: string; atletaIds?: string[]; quantidade?: number; mesInicial?: number; valor?: number; diaVencimento?: number; periodo?: string; silencioso?: boolean; forcar?: boolean }) {
  const { atletaId, atletaIds, quantidade = 1, valor = 85, diaVencimento = 10, periodo = 'mensal', forcar = false } = params
  const ids = atletaIds || (atletaId ? [atletaId] : [])
  if (!ids.length) return { criadas: 0, geradas: 0, puladas: 0 }
  const escolaId = await getEscolaIdServer()
  // O 'periodo' manda quando vier semestral/anual; caso contrario respeita
  // 'quantidade'. Antes o 'quantidade' era ignorado — por isso a pre-geracao
  // de 12 meses da aprovacao de matricula criava apenas 1 cobranca.
  const qtd = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : Math.max(1, Number(quantidade) || 1)
  const agora = new Date()
  const grupoId = qtd > 1 ? crypto.randomUUID() : null
  const insertions = []
  // Busca nomes dos atletas de uma vez
  const { data: atletasInfo } = await supabaseAdmin
    .from('Atleta').select('id, nome').in('id', ids)
  const nomeMap = Object.fromEntries((atletasInfo || []).map(a => [a.id, (a.nome || '').trim()]))

  // Competencias que ja tem mensalidade ativa — nao duplicar
  const { data: jaAtivas } = await supabaseAdmin
    .from('Cobranca').select('atletaId, competencia, descricao')
    .in('atletaId', ids).is('excluidaEm', null)
    .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])
  const jaTem = new Set(
    (jaAtivas || [])
      .filter(c => c.competencia && String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade'))
      .map(c => `${c.atletaId}|${String(c.competencia).slice(0, 10)}`)
  )

  let puladas = 0
  for (const aid of ids) {
    for (let i = 0; i < qtd; i++) {
      const venc = dataVencimentoNoMes(agora.getFullYear(), agora.getMonth() + i, diaVencimento)
      const competencia = venc.slice(0, 7) + '-01'
      if (!forcar && jaTem.has(`${aid}|${competencia}`)) { puladas++; continue }
      insertions.push({
        id: crypto.randomUUID(), escolaId, atletaId: aid,
        atletaNome: nomeMap[aid] || null,
        valor, vencimento: venc, competencia,
        status: 'PENDENTE', descricao: `Mensalidade${qtd > 1 ? ` (${i + 1}/${qtd})` : ''}`,
        periodo, qtdParcelas: qtd, parcelaAtual: i + 1,
        grupoCobrancaId: grupoId, tipo: 'MANUAL',
      })
    }
  }
  if (insertions.length > 0) {
    const { error } = await supabaseAdmin.from('Cobranca').insert(insertions)
    if (error) throw new Error('Erro ao gerar mensalidades: ' + error.message)
  }
  revalidatePath('/financeiro/mensalidades')
  return { geradas: insertions.length, criadas: insertions.length, puladas }
}

/**
 * Exclusao (soft). Ordem obrigatoria: cancela no Asaas PRIMEIRO, so grava
 * depois. Se o Asaas recusar, a exclusao nao acontece e o motivo sobe pra
 * tela — melhor uma exclusao travada do que um codigo PIX orfao cobrando
 * uma familia que ja saiu.
 */
export async function softDeleteCobranca(cobrancaId: string) {
  const pix = await cancelarPixDaCobranca(cobrancaId)
  if (!pix.ok) throw new Error(`Nao foi possivel excluir: ${pix.erro}.`)

  const { data, error } = await supabaseAdmin.from('Cobranca').update({
    status: 'CANCELADO',
    excluidaEm: new Date().toISOString(),
    ...CAMPOS_PIX_LIMPOS,
  }).eq('id', cobrancaId).select('id')

  if (error) throw new Error('Erro ao excluir: ' + error.message)
  if (!data || data.length === 0) throw new Error('Nenhuma cobranca foi excluida — verifique o id.')

  revalidatePath('/financeiro/mensalidades')
  return { ok: true as const, pixCancelado: pix.cancelado, observacao: pix.observacao }
}

/**
 * Restaurar precisa zerar o asaasId: o pagamento foi DELETADO no Asaas na
 * exclusao, entao aquele id nao volta. Sem zerar, a cobranca renasce
 * apontando pra um pagamento que nao existe e a regua manda um QR morto.
 */
export async function restaurarCobranca(cobrancaId: string) {
  const { error } = await supabaseAdmin.from('Cobranca').update({
    excluidaEm: null,
    status: 'PENDENTE',
    asaasId: null,
    ...CAMPOS_PIX_LIMPOS,
  }).eq('id', cobrancaId)
  if (error) throw new Error('Erro ao restaurar: ' + error.message)
  revalidatePath('/financeiro/mensalidades')
  return { ok: true as const, aviso: 'Cobranca restaurada sem PIX — gere um novo codigo antes de cobrar.' }
}

/**
 * Exclusao definitiva: apaga a linha. Precisa cancelar no Asaas ANTES,
 * senao o asaasId some junto com a linha e o codigo fica orfao pra sempre,
 * invisivel ate pra rotina de conciliacao.
 */
export async function excluirDefinitivo(cobrancaId: string) {
  const pix = await cancelarPixDaCobranca(cobrancaId)
  if (!pix.ok) throw new Error(`Nao foi possivel excluir definitivamente: ${pix.erro}.`)

  const { error } = await supabaseAdmin.from('Cobranca').delete().eq('id', cobrancaId)
  if (error) throw new Error('Erro ao excluir definitivamente: ' + error.message)

  revalidatePath('/financeiro/mensalidades')
  return { ok: true as const, pixCancelado: pix.cancelado }
}

export async function marcarPago(cobrancaId: string, valorPago?: number, formaPagamento?: string) {
  const pix = await cancelarPixDaCobranca(cobrancaId)

  // Sem valor informado, cai no valor da propria cobranca — nunca NULL.
  let valorFinal: number | null = valorPago ?? null
  if (valorFinal == null) {
    const { data: cob } = await supabaseAdmin.from('Cobranca').select('valor').eq('id', cobrancaId).maybeSingle()
    valorFinal = cob?.valor ?? null
  }

  const { error } = await supabaseAdmin.from('Cobranca').update({
    status: 'PAGO',
    pagoEm: new Date().toISOString(),
    valorPago: valorFinal,
    baixaManual: true,
    baixaManualEm: new Date().toISOString(),
    tipo: formaPagamento || 'MANUAL',
    ...(pix.ok ? CAMPOS_PIX_LIMPOS : {}),
  }).eq('id', cobrancaId)

  if (error) throw new Error('Erro ao marcar como pago: ' + error.message)
  revalidatePath('/financeiro/mensalidades')

  return pix.ok
    ? { ok: true as const }
    : { ok: true as const, aviso: `Marcado como pago, mas o PIX continua ativo no Asaas (${pix.erro}).` }
}

export async function alterarDiaVencimentoEmMassa(atletaIds: string[], dia: number) {
  return alterarDiaVencimentoMassa(atletaIds, dia)
}
