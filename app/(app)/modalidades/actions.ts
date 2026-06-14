'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

import { PLANOS_GESTAOFC } from './constants'

export async function listarModalidadesEscola() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('ModalidadeEscola')
    .select('id, modalidade, ativa')
    .eq('escolaId', escolaId)
  return data ?? []
}

export async function getInfoEscola() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Escola')
    .select('planoGestaoFC, maxModalidades')
    .eq('id', escolaId)
    .single()
  return data
}

export async function toggleModalidade(modalidade: string, ativa: boolean) {
  const escolaId = await getEscolaIdServer()

  if (ativa) {
    // Verifica limite do plano
    const { data: escola } = await supabaseAdmin
      .from('Escola').select('maxModalidades').eq('id', escolaId).single()
    const { count } = await supabaseAdmin
      .from('ModalidadeEscola')
      .select('*', { count: 'exact', head: true })
      .eq('escolaId', escolaId).eq('ativa', true)
    if ((count || 0) >= (escola?.maxModalidades || 1)) {
      throw new Error('Limite de modalidades do seu plano atingido. Faça upgrade para adicionar mais.')
    }
  }

  const { data: existing } = await supabaseAdmin
    .from('ModalidadeEscola')
    .select('id').eq('escolaId', escolaId).eq('modalidade', modalidade).single()

  if (existing) {
    await supabaseAdmin.from('ModalidadeEscola')
      .update({ ativa }).eq('escolaId', escolaId).eq('modalidade', modalidade)
  } else {
    await supabaseAdmin.from('ModalidadeEscola')
      .insert({ escolaId, modalidade, ativa })
  }
  return { ok: true }
}
