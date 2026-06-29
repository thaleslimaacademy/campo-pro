'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

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

export async function baixaManualCobranca(cobrancaId: string, valorPago: number, formaPagamento: string) {
  await supabaseAdmin.from('Cobranca').update({
    status: 'PAGO',
    pagoEm: new Date().toISOString(),
    valorPago,
    baixaManual: true,
    baixaManualEm: new Date().toISOString(),
    tipo: formaPagamento,
  }).eq('id', cobrancaId)
  revalidatePath('/financeiro/mensalidades')
}

export async function cancelarCobranca(cobrancaId: string) {
  await supabaseAdmin.from('Cobranca').update({ status: 'CANCELADO', excluidaEm: new Date().toISOString() }).eq('id', cobrancaId)
  revalidatePath('/financeiro/mensalidades')
}

// ── Aliases e funções legadas usadas pela página existente ──
export async function listarMensalidades(opts?: { status?: string; incluirExcluidas?: boolean }) {
  const escolaId = await getEscolaIdServer()
  let q = supabaseAdmin.from('Cobranca').select('id, atletaId, atletaNome, valor, valorPago, vencimento, status, descricao, periodo, baixaManual, tipo, pagoEm, excluidaEm, grupoCobrancaId, qtdParcelas, parcelaAtual').eq('escolaId', escolaId).order('vencimento', { ascending: false }).limit(300)
  if (opts?.status && opts.status !== 'TODOS') q = q.eq('status', opts.status)
  if (!opts?.incluirExcluidas) q = q.is('excluidaEm', null)
  const { data } = await q
  return data ?? []
}

export async function listarAtletas() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Atleta').select('id, nome, diaVencimento, planoMensalidade, valorMensalidade, bolsista').eq('escolaId', escolaId).eq('ativo', true).order('nome')
  return data ?? []
}

export async function gerarMensalidades(params: { atletaId?: string; atletaIds?: string[]; quantidade?: number; mesInicial?: number; valor?: number; diaVencimento?: number; periodo?: string }) {
  const { atletaId, atletaIds, quantidade = 1, mesInicial, valor = 85, diaVencimento = 10, periodo = 'mensal' } = params
  const ids = atletaIds || (atletaId ? [atletaId] : [])
  if (!ids.length) return { criadas: 0, geradas: 0 }
  const escolaId = await getEscolaIdServer()
  const qtd = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 1
  const agora = new Date()
  const grupoId = qtd > 1 ? crypto.randomUUID() : null
  const insertions = []
  for (const atletaId of ids) {
    for (let i = 0; i < qtd; i++) {
      const dataVenc = new Date(agora.getFullYear(), agora.getMonth() + i, diaVencimento)
      insertions.push({
        id: crypto.randomUUID(), escolaId, atletaId,
        valor, vencimento: dataVenc.toISOString().split('T')[0],
        status: 'PENDENTE', descricao: `Mensalidade${qtd > 1 ? ` (${i+1}/${qtd})` : ''}`,
        periodo, qtdParcelas: qtd, parcelaAtual: i + 1,
        grupoCobrancaId: grupoId, tipo: 'MANUAL',
      })
    }
  }
  if (insertions.length > 0) await supabaseAdmin.from('Cobranca').insert(insertions)
  revalidatePath('/financeiro/mensalidades')
  return { geradas: insertions.length, criadas: insertions.length }
}

export async function softDeleteCobranca(cobrancaId: string) {
  await supabaseAdmin.from('Cobranca').update({ excluidaEm: new Date().toISOString(), status: 'CANCELADO' }).eq('id', cobrancaId)
  revalidatePath('/financeiro/mensalidades')
}

export async function restaurarCobranca(cobrancaId: string) {
  await supabaseAdmin.from('Cobranca').update({ excluidaEm: null, status: 'PENDENTE' }).eq('id', cobrancaId)
  revalidatePath('/financeiro/mensalidades')
}

export async function excluirDefinitivo(cobrancaId: string) {
  await supabaseAdmin.from('Cobranca').delete().eq('id', cobrancaId)
  revalidatePath('/financeiro/mensalidades')
}

export async function marcarPago(cobrancaId: string, valorPago?: number, formaPagamento?: string) {
  await supabaseAdmin.from('Cobranca').update({
    status: 'PAGO', pagoEm: new Date().toISOString(),
    valorPago: valorPago || null, baixaManual: true,
    baixaManualEm: new Date().toISOString(),
    tipo: formaPagamento || 'MANUAL',
  }).eq('id', cobrancaId)
  revalidatePath('/financeiro/mensalidades')
}

export async function alterarDiaVencimentoEmMassa(atletaIds: string[], dia: number) {
  return alterarDiaVencimentoMassa(atletaIds, dia)
}
