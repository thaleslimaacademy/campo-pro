'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { gerarPixOuAgregarFamilia } from '@/lib/cobrancaFamilia'
import { cancelarAssinaturaAsaas } from '@/lib/asaas'
import { dataVencimentoNoMes, clampDiaPreferido } from '@/lib/dataVencimento'
import { cancelarPixDaCobranca } from '@/lib/cancelarPixDaCobranca'

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
    .select('id, valor, asaasId, vencimento, competencia, descricao')
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
  //
  // 25/08/2026 — esta era a QUARTA fonte de PIX orfao. O codigo antigo
  // chamava cancelarCobrancaAsaas() (que engole o status da resposta) dentro
  // de um try, e logo depois zerava o asaasId de qualquer jeito. Quando o
  // Asaas recusava, o PIX velho continuava cobravel e o unico vinculo com
  // ele — o asaasId — era apagado: orfao invisivel. Foi assim que as 3
  // mensalidades de R$170 da familia Kaike+Rhyan sobreviveram a troca pra
  // R$160. Agora o cancelamento e verificado, e sem confirmacao a cobranca
  // fica exatamente como estava (valor antigo, PIX antigo, ainda rastreavel).
  const comPix = mensalidades.filter(c => c.asaasId)
  if (comPix.length) {
    for (const cob of comPix) {
      const cancelou = await cancelarPixDaCobranca(cob.id)
      if (!cancelou.ok) {
        avisos.push(
          `Cobranca de ${String(cob.vencimento).slice(0, 10)}: o PIX antigo NAO pode ser cancelado ` +
          `(${cancelou.erro}). O valor dela ficou como estava, pra nao deixar um codigo PIX vivo sem dono. ` +
          `Tente salvar de novo em alguns minutos.`
        )
        continue
      }
      await supabaseAdmin.from('Cobranca').update({
        valor: novoValor, asaasId: null, pixCopiaCola: null, pixQrCode: null,
      }).eq('id', cob.id)

      const gerado = await gerarPixOuAgregarFamilia(
        cob.id, escolaId, atletaId, novoValor, String(cob.vencimento).slice(0, 10), String(cob.competencia).slice(0, 10)
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
  // Mesma correcao da propagacao de valor: cancelamento verificado antes de
  // soltar o asaasId. Ver o comentario longo em propagarValorMensalidade.
  const comPix = comNovaData.filter(c => c.asaasId)
  if (comPix.length) {
    for (const cob of comPix) {
      const cancelou = await cancelarPixDaCobranca(cob.id)
      if (!cancelou.ok) {
        avisos.push(
          `Cobranca de ${String(cob.vencimento).slice(0, 10)}: o PIX antigo NAO pode ser cancelado ` +
          `(${cancelou.erro}). O vencimento dela ficou como estava, pra nao deixar um codigo PIX vivo sem dono.`
        )
        continue
      }
      await supabaseAdmin.from('Cobranca').update({
        vencimento: cob.novoVencimento, asaasId: null, pixCopiaCola: null, pixQrCode: null,
      }).eq('id', cob.id)

      const gerado = await gerarPixOuAgregarFamilia(
        cob.id, escolaId, atletaId, Number(cob.valor), cob.novoVencimento, String(cob.competencia).slice(0, 10)
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
  if (error) return { ok: false as const, erro: 'Falha ao salvar o atleta: ' + error.message }
  revalidatePath(`/atletas/${id}`)
  revalidatePath('/atletas')
  revalidatePath('/financeiro/mensalidades')

  if (avisos.length) return { ok: true as const, avisosMensalidade: avisos }
  return { ok: true as const }
}

export async function toggleAtivoAtleta(id: string, ativo: boolean) {
  const escolaId = await getEscolaIdServer()

  const { error } = await supabaseAdmin.from('Atleta')
    .update({ ativo }).eq('id', id).eq('escolaId', escolaId)
  if (error) return { ok: false as const, erro: 'Falha ao mudar o status do atleta: ' + error.message }

  let canceladas = 0
  if (!ativo) {
    // Se o atleta esta em debito automatico, a assinatura na Asaas continua
    // cobrando sozinha mesmo depois de desativado aqui — precisa cancelar
    // a assinatura junto, nao so as cobrancas avulsas.
    const { data: atletaAtual } = await supabaseAdmin.from('Atleta')
      .select('asaasSubscriptionId').eq('id', id).single()
    if (atletaAtual?.asaasSubscriptionId) {
      try {
        const apiKeyAssinatura = await getAsaasKey(escolaId)
        await cancelarAssinaturaAsaas(apiKeyAssinatura, atletaAtual.asaasSubscriptionId)
      } catch (e) {
        console.error('Falha ao cancelar assinatura na Asaas:', (e as Error).message)
      }
      await supabaseAdmin.from('Atleta')
        .update({ asaasSubscriptionId: null, formaPagamento: 'MANUAL' }).eq('id', id)
    }

    const hoje = new Date().toISOString().slice(0, 10)
    const { data: futuras } = await supabaseAdmin.from('Cobranca')
      .select('id, asaasId')
      .eq('atletaId', id)
      .eq('escolaId', escolaId)
      .eq('status', 'PENDENTE')
      .is('excluidaEm', null)
      .gt('vencimento', hoje)

    if (futuras?.length) {
      // Cancela no Asaas ANTES de marcar. So marca como cancelada a mensalidade
      // cujo PIX realmente morreu — o resto continua ativo no app, com o codigo
      // ainda rastreavel, e o motivo sobe pra tela. Antes, o erro do Asaas era
      // engolido e a linha era marcada assim mesmo: PIX vivo, cobranca sumida
      // da tela (o "fantasma" que a conciliacao passou a pegar).
      const okIds: string[] = []
      const falhas: string[] = []

      for (const c of futuras) {
        if (!c.asaasId) { okIds.push(c.id); continue }
        const r = await cancelarPixDaCobranca(c.id)
        if (r.ok) okIds.push(c.id)
        else falhas.push(r.erro)
      }

      if (okIds.length) {
        const { error: eCanc } = await supabaseAdmin.from('Cobranca').update({
          status: 'CANCELADO', excluidaEm: new Date().toISOString(),
        }).in('id', okIds)
        if (eCanc) return { ok: false as const, erro: 'Atleta desativado, mas FALHOU ao cancelar as mensalidades futuras: ' + eCanc.message + '. O PIX pode continuar ativo na Asaas.' }
      }
      canceladas = okIds.length

      if (falhas.length) {
        return {
          ok: false as const,
          erro: `Atleta desativado e ${okIds.length} mensalidade(s) futura(s) cancelada(s), mas ${falhas.length} nao pode(m) ser cancelada(s) na Asaas ` +
            `(${falhas[0]}). Essa(s) continua(m) ativa(s) no app pra nao virar cobranca fantasma — tente desativar de novo em alguns minutos.`,
        }
      }
    }
  }

  revalidatePath(`/atletas/${id}`)
  revalidatePath('/atletas')
  revalidatePath('/financeiro/mensalidades')
  return { ok: true as const, canceladas }
}

/**
 * Exclusao definitiva do atleta.
 *
 * REGRA DE OURO desta funcao: nada e apagado do banco antes de estar
 * cancelado na Asaas. O delete apaga o `asaasId` junto com a linha, entao
 * um PIX que sobreviva ao delete vira orfao PERMANENTE — sem nenhum
 * registro apontando pra ele, invisivel ate pra rotina de conciliacao.
 * Foi assim que sobraram cobrancas de "atleta teste" vencendo em 2027.
 */
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
    return { ok: false as const, erro: 'Não foi possível confirmar se há pagamentos registrados. Exclusão cancelada por segurança: ' + erroContagem.message }
  }

  if (pagas && pagas > 0) {
    return {
      ok: false as const,
      erro: `Este atleta tem ${pagas} pagamento(s) registrado(s). Excluir apagaria o histórico financeiro. ` +
        `Use "Desativar atleta" — as mensalidades futuras são canceladas e o histórico é preservado.`,
    }
  }

  // ── 1. Assinatura recorrente de cartao ──
  // Sem isso, o cartao do responsavel continua sendo cobrado todo mes
  // depois do atleta deixar de existir, e nao sobra nada no banco que
  // permita descobrir isso. Falhou = aborta antes de apagar qualquer coisa.
  const { data: atletaAtual } = await supabaseAdmin.from('Atleta')
    .select('asaasSubscriptionId').eq('id', id).eq('escolaId', escolaId).maybeSingle()

  if (atletaAtual?.asaasSubscriptionId) {
    try {
      const apiKey = await getAsaasKey(escolaId)
      if (!apiKey) throw new Error('escola sem chave Asaas configurada')
      await cancelarAssinaturaAsaas(apiKey, atletaAtual.asaasSubscriptionId)
    } catch (e) {
      return {
        ok: false as const,
        erro: 'Exclusão cancelada: o atleta está em débito automático e não foi possível cancelar a assinatura na Asaas ' +
          `(${(e as Error).message}). Sem isso o cartão do responsável continuaria sendo cobrado. Tente de novo em alguns minutos.`,
      }
    }
    await supabaseAdmin.from('Atleta')
      .update({ asaasSubscriptionId: null, formaPagamento: 'MANUAL' }).eq('id', id)
  }

  // ── 2. Cobrancas com PIX vivo na Asaas ──
  // Inclui as ja marcadas como excluidas: o PIX delas pode nunca ter sido
  // cancelado (bug anterior), e o delete abaixo levaria o asaasId junto.
  const { data: comAsaas, error: erroBuscaCob } = await supabaseAdmin.from('Cobranca')
    .select('id, asaasId, status, familiaCobrancaId')
    .eq('atletaId', id)
    .not('asaasId', 'is', null)

  if (erroBuscaCob) {
    return { ok: false as const, erro: 'Não foi possível listar as cobranças do atleta. Exclusão cancelada: ' + erroBuscaCob.message }
  }

  // Cobranca de familia e compartilhada entre irmaos — cancelar aqui
  // derrubaria o PIX do irmao tambem. Nao mexe: avisa e para.
  const familia = (comAsaas ?? []).filter(c => c.familiaCobrancaId)
  if (familia.length) {
    return {
      ok: false as const,
      erro: `Este atleta tem ${familia.length} cobrança(s) agrupada(s) com irmão(s). ` +
        `Desmembre a cobrança familiar antes de excluir, senão o PIX do irmão seria cancelado junto.`,
    }
  }

  const falhas: string[] = []
  for (const cob of comAsaas ?? []) {
    const r = await cancelarPixDaCobranca(cob.id)
    if (!r.ok) falhas.push(`${cob.id}: ${r.erro}`)
  }

  if (falhas.length) {
    return {
      ok: false as const,
      erro: `Exclusão cancelada: ${falhas.length} cobrança(s) não puderam ser canceladas na Asaas e o PIX continuaria ativo. ` +
        `Detalhe: ${falhas.slice(0, 3).join(' | ')}`,
    }
  }

  // ── 3. So agora apaga ──
  await Promise.all([
    supabaseAdmin.from('Presenca').delete().eq('atletaId', id),
    supabaseAdmin.from('Cobranca').delete().eq('atletaId', id),
    supabaseAdmin.from('Responsavel').delete().eq('atletaId', id),
    supabaseAdmin.from('Avaliacao').delete().eq('atletaId', id),
  ])
  const { error } = await supabaseAdmin.from('Atleta').delete().eq('id', id).eq('escolaId', escolaId)
  if (error) return { ok: false as const, erro: 'Dados do atleta apagados, mas falhou ao apagar o cadastro: ' + error.message }
  revalidatePath('/atletas')
  revalidatePath('/financeiro/mensalidades')
  return { ok: true as const, pixCancelados: (comAsaas ?? []).length }
}
