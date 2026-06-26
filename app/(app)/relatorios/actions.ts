'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function getAtletasETurmas() {
  const escolaId = await getEscolaIdServer()
  const [atsRes, tmsRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('id, nome, posicao, turmaId').eq('escolaId', escolaId).eq('ativo', true).order('nome'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).order('nome'),
  ])
  return { escolaId, atletas: atsRes.data ?? [], turmas: tmsRes.data ?? [] }
}
