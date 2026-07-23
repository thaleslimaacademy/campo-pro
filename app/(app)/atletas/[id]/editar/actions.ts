'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { cancelarCobrancaAsaas } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'

export async function getAtletaParaEditar(id: string) {
  const escolaId = await getEscolaIdServer()
  const [atletaRes, planosRes, turmasRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('*').eq('id', id).eq('escolaId', escolaId).single(),
    supabaseAdmin.from('PlanoMensalidade').select('id, nome, slug, valor').eq('escolaId', escolaId).order('valor'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
  ])
  return { escolaId, atleta: atletaRes.data, planos: planosRes.data ?? [], turmas: turmasRes.data ?? [] }
}

export async function salvarAtleta(id: string, payload: Record<string, unknown>) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Atleta').update(payload).eq('id', id).eq('escolaId', escolaId)
  // antes o erro era ignorado: a tela dizia "Salvo!" sem ter salvado nada
  if (error) throw new Error(error.message)
  revalidatePath(`/atletas/${id}`)
  revalidatePath('/atletas')
}

/**
 * Ativa/desativa o atleta.
 *
 * Ao DESATIVAR (aluno desistiu), cancela as mensalidades futuras que ainda
 * estao em aberto — inclusive no Asaas. Sem isso, as 12 mensalidades
 * pre-geradas continuariam cobrando o responsavel por meses depois da saida.
 * As cobrancas ja pagas e as vencidas em aberto sao preservadas: pagas viram
 * historico financeiro, vencidas ainda podem ser negociadas.
 */
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

/**
 * Exclui o atleta em definitivo. So deve ser usado para cadastro errado.
 *
 * Se existir qualquer cobranca PAGA, a exclusao e bloqueada: apagar destruiria
 * o historico financeiro (dinheiro que entrou sumiria do caixa). Nesse caso o
 * correto e DESATIVAR, que cancela o que esta por vir e preserva o passado.
 */
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
