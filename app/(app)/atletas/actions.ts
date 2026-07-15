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

  // Responsavel principal de cada atleta (exibido na lista e na grade)
  const atletas = atletasRes.data ?? []
  const respMap = new Map<string, string>()
  if (atletas.length) {
    const { data: resps } = await supabaseAdmin
      .from('Responsavel')
      .select('atletaId, nome, principal')
      .in('atletaId', atletas.map(a => a.id))
    for (const r of resps ?? []) {
      // o principal sempre ganha; se nao houver principal, fica o primeiro
      if (r.principal || !respMap.has(r.atletaId)) respMap.set(r.atletaId, r.nome)
    }
  }

  return {
    atletas: atletas.map(a => ({ ...a, responsavelNome: respMap.get(a.id) ?? null })),
    turmas: turmasRes.data ?? [],
  }
}
