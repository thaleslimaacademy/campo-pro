// lib/detectarFamilias.ts
//
// Detecta possíveis irmãos (mesmo responsável) cruzando os campos de
// responsável 1 e 2 da Matricula aprovada de cada atleta ativo.
//
// Hierarquia de confiança: CPF > telefone > nome (nome sozinho não é
// suficiente pra vincular automaticamente — só reforça um match de
// CPF ou telefone).
//
// Chamada por aprovarMatricula() em app/(app)/matriculas/actions.ts, no
// final, depois que o Atleta já existe e a Matricula já está APROVADO.

import { supabaseAdmin } from '@/lib/supabase'

type ResponsavelNormalizado = {
  atletaId: string
  escolaId: string
  cpf: string | null
  telefone: string | null
  nome: string | null
}

function normalizarCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null
  const digitos = cpf.replace(/\D/g, '')
  return digitos.length === 11 ? digitos : null
}

function normalizarTelefone(tel: string | null | undefined): string | null {
  if (!tel) return null
  const digitos = tel.replace(/\D/g, '')
  // compara só os últimos 8 dígitos (ignora DDD/9 na frente, que varia de digitação)
  return digitos.length >= 8 ? digitos.slice(-8) : null
}

function normalizarNome(nome: string | null | undefined): string | null {
  if (!nome) return null
  const limpo = nome.trim().toUpperCase()
  return limpo.length > 5 ? limpo : null
}

/**
 * Busca a Matricula APROVADO mais recente do atleta e devolve os dois
 * possíveis responsáveis já normalizados.
 */
async function buscarResponsaveisDoAtleta(atletaId: string): Promise<ResponsavelNormalizado[]> {
  const { data: matricula } = await supabaseAdmin
    .from('Matricula')
    .select('atletaId, escolaId, nomeResponsavel, cpfResponsavel, whatsappResponsavel, nomeResponsavel2, cpfResponsavel2, whatsappResponsavel2, dataAprovacao, criadoEm')
    .eq('atletaId', atletaId)
    .eq('status', 'APROVADO')
    .order('dataAprovacao', { ascending: false, nullsFirst: false })
    .order('criadoEm', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!matricula) return []

  return [
    {
      atletaId,
      escolaId: matricula.escolaId,
      cpf: normalizarCpf(matricula.cpfResponsavel),
      telefone: normalizarTelefone(matricula.whatsappResponsavel),
      nome: normalizarNome(matricula.nomeResponsavel),
    },
    {
      atletaId,
      escolaId: matricula.escolaId,
      cpf: normalizarCpf(matricula.cpfResponsavel2),
      telefone: normalizarTelefone(matricula.whatsappResponsavel2),
      nome: normalizarNome(matricula.nomeResponsavel2),
    },
  ]
}

/**
 * Roda a detecção pra UM atleta recém-aprovado contra todos os outros
 * atletas ativos da MESMA escola. Se achar um match forte (CPF ou
 * telefone batendo), cria ou reaproveita uma Familia e vincula os dois
 * atletas a ela com status PENDENTE (precisa de confirmação manual
 * antes de virar cobrança conjunta).
 *
 * Retorna o id da Familia criada/reaproveitada, ou null se não achou match.
 */
export async function detectarFamiliaParaAtleta(atletaId: string): Promise<string | null> {
  const responsaveisNovo = await buscarResponsaveisDoAtleta(atletaId)
  if (responsaveisNovo.length === 0) return null

  const escolaId = responsaveisNovo[0].escolaId

  // pega todos os outros atletas ativos da escola que já têm matrícula aprovada
  const { data: outrosAtletas } = await supabaseAdmin
    .from('Atleta')
    .select('id, familiaId')
    .eq('escolaId', escolaId)
    .eq('ativo', true)
    .neq('id', atletaId)

  if (!outrosAtletas || outrosAtletas.length === 0) return null

  for (const outro of outrosAtletas as { id: string; familiaId: string | null }[]) {
    const responsaveisOutro = await buscarResponsaveisDoAtleta(outro.id)

    const bateForte = responsaveisNovo.some((rn) =>
      responsaveisOutro.some(
        (ro) =>
          (rn.cpf && ro.cpf && rn.cpf === ro.cpf) ||
          (rn.telefone && ro.telefone && rn.telefone === ro.telefone)
      )
    )

    if (!bateForte) continue

    // achou um irmão. Se o outro atleta já está numa família, entra nela.
    // Senão, cria uma família nova.
    let familiaId = outro.familiaId

    const respRef = responsaveisNovo[0]

    if (!familiaId) {
      const { data: novaFamilia } = await supabaseAdmin
        .from('Familia')
        .insert({
          escolaId,
          nomeResponsavel: respRef.nome,
          cpfResponsavel: respRef.cpf,
          whatsappResponsavel: respRef.telefone,
          status: 'PENDENTE',
        })
        .select('id')
        .single()

      familiaId = novaFamilia?.id ?? null
      if (!familiaId) continue

      await supabaseAdmin.from('Atleta').update({ familiaId }).eq('id', outro.id)
    } else {
      // já existe família — qualquer adição nova volta o status pra
      // PENDENTE, pra você revisar de novo antes de continuar cobrando junto
      await supabaseAdmin.from('Familia').update({ status: 'PENDENTE' }).eq('id', familiaId)
    }

    await supabaseAdmin.from('Atleta').update({ familiaId }).eq('id', atletaId)

    return familiaId
  }

  return null
}
