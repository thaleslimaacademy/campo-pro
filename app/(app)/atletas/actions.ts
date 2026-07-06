'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function getAtletasComTurmas() {
  const escolaId = await getEscolaIdServer()
  const [atletasRes, turmasRes] = await Promise.all([
    supabaseAdmin
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, bolsista, dataNascimento, turmaId, ativo, diaVencimento, valorMensalidade, planoMensalidade')
      .eq('escolaId', escolaId)
      .eq('ativo', true)
      .order('nome'),
    supabaseAdmin
      .from('Turma')
      .select('id, nome')
      .eq('escolaId', escolaId),
  ])
  return {
    atletas: atletasRes.data ?? [],
    turmas: turmasRes.data ?? [],
  }
}
