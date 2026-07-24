'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { cancelarCobrancaAsaas } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { gerarPixSeFaltar } from '@/lib/gerarPixSeFaltar'

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
 * Sem PIX gerado ainda: so atualiza o valor no banco. Com PIX ja gerado:
 * cancela o PIX antigo na Asaas e gera outro na hora com o valor novo.
 */
async function propagarValorMensalidade(atletaId: string, escolaId: string, novoValor: number) {
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: futuras, error: erroBusca } = await supabaseAdmin.from('Cobranca')
    .select('id, valor, asaasId, vencimento, descricao')
    .eq('atletaId', atletaId)
    .eq('escolaId', escolaId)
    .eq('status', 'PENDENTE')
    .is('excluidaEm', null)
    .gte('vencimento', hoje)

  if (erroBusca) return { atualizadas: 0, avisos: [`Falha ao buscar cobranças futuras: ${erroBusca.message}`] }

  const mensalidades = (futuras ?? []).filter(c =>
    String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade')
  )

  let atualizadas = 0
  const avisos: string[] = []
  let apiKey: string | null = null

  for (const cob of mensalidades) {
    if (Number(cob.valor) === novoValor) continue

    if (!cob.asaasId) {
      const { error } = await supabaseAdmin.from('Cobranca')
        .update({ valor: novoValor }).eq('id', cob.id)
      if (error) avisos.push(`Cobrança ${cob.id}: ${error.message}`)
      else atualizadas++
      continue
    }

    if (apiKey === null) {
      try { apiKey = await getAsaasKey(escolaId) } catch { apiKey = '' }
    }
    if (!apiKey) {
      avisos.push(`Cobrança ${cob.id}: sem chave Asaas configurada, PIX não regenerado`)
      continue
    }

    try {
      await cancelarCobrancaAsaas(apiKey, cob.asaasId)
    } catch (e) {
      avisos.push(`Cobrança ${cob.id}: falha ao cancelar PIX antigo — ${(e as Error).message}`)
      continue
    }

    await supabaseAdmin.from('Cobranca').update({
      valor: novoValor, asaasId: null, pixCopiaCola: null, pixQrCode: null,
    }).eq('id', cob.id)

    const gerado = await gerarPixSeFaltar(
      cob.id, escolaId, atletaId, novoValor, String(cob.vencimento).slice(0, 10)
    )
    if (!gerado) avisos.push(`Cobrança ${cob.id}: valor atualizado mas o novo PIX falhou — será recriado no D-3`)
    atualizadas++
  }

  return { atualizadas, avisos }
}

export async function salvarAtleta(id: string, payload: Record<string, unknown>) {
  const escolaId = await getEscolaIdServer()

  let avisosMensalidade: string[] | null = null
  if ('valorMensalidade' in payload) {
    const novoValor = Number(payload.valorMensalidade)
    if (!Number.isNaN(novoValor)) {
      const { data: atual } = await supabaseAdmin.from('Atleta')
        .select('valorMensalidade').eq('id', id).eq('escolaId', escolaId).single()
      if (atual && Number(atual.valorMensalidade) !== novoValor) {
        const resultado = await propagarValorMensalidade(id, escolaId, novoValor)
        if (resultado.avisos.length) avisosMensalidade = resultado.avisos
      }
    }
  }

  const { error } = await supabaseAdmin.from('Atleta').update(payload).eq('id', id).eq('escolaId', escolaId)
  if (error) throw new Error(error.message)
  revalidatePath(`/atletas/${id}`)
  revalidatePath('/atletas')
  revalidatePath('/financeiro/mensalidades')

  if (avisosMensalidade) return { ok: true, avisosMensalidade }
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

  const { count: pagas } = await supabaseAdmin.from('Cobranca')
    .select('id', { count: 'exact', head: true })
    .eq('atletaId', id)
    .eq('status', 'PAGO')

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
