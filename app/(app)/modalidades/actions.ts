'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export const MODALIDADES = [
  { slug: 'futebol',       label: 'Futebol',        emoji: '⚽' },
  { slug: 'futsal',        label: 'Futsal',          emoji: '🥅' },
  { slug: 'volei',         label: 'Vôlei',           emoji: '🏐' },
  { slug: 'basquete',      label: 'Basquete',        emoji: '🏀' },
  { slug: 'artes-marciais',label: 'Artes Marciais',  emoji: '🥋' },
  { slug: 'beach-tennis',  label: 'Beach Tennis',    emoji: '🎾' },
  { slug: 'outras',        label: 'Outras',          emoji: '🏅' },
]

export const POSICOES_POR_MODALIDADE: Record<string, string[]> = {
  futebol:        ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Centroavante', 'Ponta'],
  futsal:         ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
  volei:          ['Levantador', 'Oposto', 'Ponteiro', 'Central', 'Líbero'],
  basquete:       ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'],
  'artes-marciais':['Faixa Branca', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
  'beach-tennis': ['Atacante', 'Defensor'],
  outras:         ['Atleta'],
}

export const PLANOS_GESTAOFC = [
  { slug: 'SIMPLE', label: 'Simple',  maxModalidades: 1, preco: 79 },
  { slug: 'MEDIO',  label: 'Médio',   maxModalidades: 2, preco: 99 },
  { slug: 'MASTER', label: 'Master',  maxModalidades: 99, preco: 149 },
]

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
