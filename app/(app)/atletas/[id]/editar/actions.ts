'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { cancelarCobrancaAsaas } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { gerarPixSeFaltar } from '@/lib/gerarPixSeFaltar'
import { dataVencimentoNoMes, clampDiaPreferido } from '@/lib/dataVencimento'

export async function getAtletaParaEditar(id: string) {
  const escolaId = await getEscolaIdServer()
  const [atletaRes, planosRes, turmasRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('*').eq('id', id).eq('escolaId', escolaId).single(),
    supabaseAdmin.from('PlanoMensalidade').select('id, nome, slug, valor').eq('escolaId', escolaId).order('valor'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
  ])
  return { escolaId, atleta: atletaRes.data, planos: planosRes.data ?? [], turmas: turmasRes.data ?? [] }
}

/**
 * Propaga uma mudanca de valorMensalidade para as cobrancas futuras que ja
 * estao pre-geradas (garantirMensalidadesFuturas roda 3 meses a frente).
 *
 * Ordem importa: primeiro atualiza em LOTE UNICO as que ainda nao tem PIX
 * (update simples, sem chamada externa) — assim, mesmo que o restante da
 * funcao seja interrompido pelo timeout de 10s da Vercel (plano Hobby, ja
 * vimos isso acontecer com o upload de foto), essas ja ficam salvas. Só
 * depois trata as que ja tem PIX na Asaas (mais lento: cancela e recria).
 */
async function propagarValorMensalidade(atletaId: string, escolaId: string, novoValor: number, avisos: string[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: futuras, error: erroBusca } = await supabaseAdmin.from('Cobranca')
    .select('id, valor, asaasId, vencimento, descricao')
    .eq('atletaId', atletaId)
    .eq('escolaId', escolaId)
    .eq('status', 'PENDENTE')
    .is('excluidaEm', null)
    .gte('vencimento', hoje)

  if (erroBusca) { avisos.push(`Falha ao buscar cobranças futuras (valor): ${erroBusca.message}`); return }

  const mensalidades = (futuras ?? []).filter(c =>
    String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade')
    && Number(c.valor) !== novoValor
  )

  // ── Passo 1: sem PIX ainda — update em lote, rapido e seguro ──
  const semPix = mensalidades.filter(c => !c.asaasId)
  if (semPix.length) {
    const { error } = await supabaseAdmin.from('Cobranca')
      .update({ valor: novoValor })
      .in('id', semPix.map(c => c.id))
    if (error) avisos.push(`Falha ao atualizar ${semPix.length} mensalidade(s) sem PIX (valor): ${error.message}`)
  }

  // ── Passo 2: com PIX na Asaas — cancela e recria, uma por vez ──
  const comPix = mensalidades.filter(c => c.asaasId)
  if (comPix.length) {
    let apiKey: string | null = null
    try { apiKey = await getAsaasKey(escolaId) } catch { apiKey = '' }

    for (const cob of comPix) {
      if (!apiKey) {
        avisos.push(`Cobrança ${cob.id}: sem chave Asaas configurada, PIX não regenerado (valor)`)
        continue
      }
      try {
        await cancelarCobrancaAsaas(apiKey, cob.asaasId as string)
      } catch (e) {
        avisos.push(`Cobrança ${cob.id}: falha ao cancelar PIX antigo (valor) — ${(e as Error).message}`)
        continue
      }
      await supabaseAdmin.from('Cobranca').update({
        valor: novoValor, asaasId: null, pixCopiaCola: null, pixQrCode: null,
      }).eq('id', cob.id)

      const gerado = await gerarPixSeFaltar(
        cob.id, escolaId, atletaId, novoValor, String(cob.vencimento).slice(0, 10)
      )
      if (!gerado) avisos.push(`Cobrança ${cob.id}: valor atualizado mas o novo PIX falhou — será recriado no D-3`)
    }
  }
}

/**
 * Propaga uma mudanca de diaVencimento para as cobrancas futuras ja
 * pre-geradas. A competencia (mes) nao muda — so o dia dentro daquele mes,
 * recalculado com dataVencimentoNoMes() pra nunca estourar (dia 31 cai em
 * 30/28/29 conforme o mes tiver menos dias). Mesma ordem sem-PIX primeiro /
 * com-PIX depois que propagarValorMensalidade, pelo mesmo motivo de timeout.
 */
async function propagarDiaVencimento(atletaId: string, escolaId: string, novoDia: number, avisos: string[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: futuras, error: erroBusca } = await supabaseAdmin.from('Cobranca')
    .select('id, vencimento, competencia, asaasId, valor, descricao')
    .eq('atletaId', atletaId)
    .eq('escolaId', escolaId)
    .eq('status', 'PENDENTE')
    .is('excluidaEm', null)
    .gte('vencimento', hoje)

  if (erroBusca) { avisos.push(`Falha ao buscar cobranças futuras (vencimento): ${erroBusca.message}`); return }

  const mensalidades = (futuras ?? []).filter(c =>
    String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade') && c.competencia
  )

  const comNovaData = mensalidades.map(c => {
    const [ano, mes] = String(c.competencia).slice(0, 7).split('-').map(Number)
    const novoVencimento = dataVencimentoNoMes(ano, mes - 1, novoDia)
    return { ...c, novoVencimento }
  }).filter(c => c.novoVencimento !== String(c.vencimento).slice(0, 10))

  // ── Passo 1: sem PIX — cada uma tem uma data nova diferente, update
  // individual (mas sem chamada externa, entao rapido mesmo assim) ──
  const semPix = comNovaData.filter(c => !c.asaasId)
  for (const cob of semPix) {
    const { error } = await supabaseAdmin.from('Cobranca')
      .update({ vencimento: cob.novoVencimento }).eq('id', cob.id)
    if (error) avisos.push(`Cobrança ${cob.id}: falha ao atualizar vencimento — ${error.message}`)
  }

  // ── Passo 2: com PIX na Asaas — cancela e recria com a data nova ──
  const comPix = comNovaData.filter(c => c.asaasId)
  if (comPix.length) {
    let apiKey: string | null = null
    try { apiKey = await getAsaasKey(escolaId) } catch { apiKey = '' }

    for (const cob of comPix) {
      if (!apiKey) {
        avisos.push(`Cobrança ${cob.id}: sem chave Asaas configurada, PIX não regenerado (vencimento)`)
        continue
      }
      try {
        await cancelarCobrancaAsaas(apiKey, cob.asaasId as string)
      } catch (e) {
        avisos.push(`Cobrança ${cob.id}: falha ao cancelar PIX antigo (vencimento) — ${(e as Error).message}`)
        continue
      }
      await supabaseAdmin.from('Cobranca').update({
        vencimento: cob.novoVencimento, asaasId: null, pixCopiaCola: null, pixQrCode: null,
      }).eq('id', cob.id)

      const gerado = await gerarPixSeFaltar(
        cob.id, escolaId, atletaId, Number(cob.valor), cob.novoVencimento
      )
      if (!gerado) avisos.push(`Cobrança ${cob.id}: vencimento atualizado mas o novo PIX falhou — será recriado no D-3`)
    }
  }
}

export async function salvarAtleta(id: string, payload: Record<string, unknown>) {
  const escolaId = await getEscolaIdServer()
  const avisos: string[] = []

  const { data: atual } = await supabaseAdmin.from('Atleta')
    .select('valorMensalidade, diaVencimento').eq('id', id).eq('escolaId', escolaId).single()

  if ('valorMensalidade' in payload) {
    const novoValor = Number(payload.valorMensalidade)
    if (!Number.isNaN(novoValor) && atual && Number(atual.valorMensalidade) !== novoValor) {
      await propagarValorMensalidade(id, escolaId, novoValor, avisos)
    }
  }

  if ('diaVencimento' in payload) {
    const novoDia = clampDiaPreferido(Number(payload.diaVencimento))
    payload.diaVencimento = novoDia
    if (atual && Number(atual.diaVencimento) !== novoDia) {
      await propagarDiaVencimento(id, escolaId, novoDia, avisos)
    }
  }

  const { error } = await supabaseAdmin.from('Atleta').update(payload).eq('id', id).eq('escolaId', escolaId)
  if (error) throw new Error(error.message)
  revalidatePath(`/atletas/${id}`)
  revalidatePath('/atletas')
  revalidatePath('/financeiro/mensalidades')

  if (avisos.length) return { ok: true, avisosMensalidade: avisos }
  return { ok: true }
}

export async function toggleAtivoAtleta(id: string, ativo: boolean) {
  const escolaId = await getEscolaIdServer()

  const { error } = await supabaseAdmin.from('Atleta')
    .update({ ativo }).eq('id', id).eq('escolaId', escolaId)
  if (error) throw new Error(error.message)

  let canceladas = 0
  if (!ativo) {
    const hoje = new Date().toISOString().slice(0, 10)
    const { data: futuras } = await supabaseAdmin.from('Cobranca')
      .select('id, asaasId')
      .eq('atletaId', id)
      .eq('escolaId', escolaId)
      .eq('status', 'PENDENTE')
      .is('excluidaEm', null)
      .gt('vencimento', hoje)

    if (futuras?.length) {
      let apiKey: string | null = null
      try { apiKey = await getAsaasKey(escolaId) } catch { apiKey = null }

      for (const c of futuras) {
        if (c.asaasId && apiKey) {
          try { await cancelarCobrancaAsaas(apiKey, c.asaasId) } catch { /* ja cancelada */ }
        }
      }
      const { error: eCanc } = await supabaseAdmin.from('Cobranca').update({
        status: 'CANCELADO', excluidaEm: new Date().toISOString(),
      }).in('id', futuras.map(c => c.id))
      if (eCanc) throw new Error('Atleta desativado, mas falhou ao cancelar as mensalidades futuras: ' + eCanc.message)
      canceladas = futuras.length
    }
  }

  revalidatePath(`/atletas/${id}`)
  revalidatePath('/atletas')
  revalidatePath('/financeiro/mensalidades')
  return { ok: true, canceladas }
}

export async function excluirAtleta(id: string) {
  const escolaId = await getEscolaIdServer()

  // Falha fechada: se a consulta der erro, PARA em vez de seguir como se
  // nao houvesse pagamento nenhum. Antes, `pagas` vinha `null` num erro de
  // rede e `null && null > 0` avaliava como falso — deixava excluir e
  // perder o historico financeiro justamente quando o sistema nao
  // conseguiu nem confirmar se havia pagamento.
  const { count: pagas, error: erroContagem } = await supabaseAdmin.from('Cobranca')
    .select('id', { count: 'exact', head: true })
    .eq('atletaId', id)
    .eq('status', 'PAGO')

  if (erroContagem) {
    throw new Error('Nao foi possivel confirmar se ha pagamentos registrados, exclusao cancelada por seguranca: ' + erroContagem.message)
  }

  if (pagas && pagas > 0) {
    throw new Error(
      `Este atleta tem ${pagas} pagamento(s) registrado(s). Excluir apagaria o histórico financeiro. ` +
      `Use "Desativar atleta" — as mensalidades futuras são canceladas e o histórico é preservado.`
    )
  }

  await Promise.all([
    supabaseAdmin.from('Presenca').delete().eq('atletaId', id),
    supabaseAdmin.from('Cobranca').delete().eq('atletaId', id),
    supabaseAdmin.from('Responsavel').delete().eq('atletaId', id),
    supabaseAdmin.from('Avaliacao').delete().eq('atletaId', id),
  ])
  const { error } = await supabaseAdmin.from('Atleta').delete().eq('id', id).eq('escolaId', escolaId)
  if (error) throw new Error(error.message)
  revalidatePath('/atletas')
  return { ok: true }
}
