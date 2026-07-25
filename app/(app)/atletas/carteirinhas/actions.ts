'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function getCarteirinhasData() {
  const escolaId = await getEscolaIdServer()

  const [atletasRes, turmasRes, escolaRes] = await Promise.all([
    supabaseAdmin.from('Atleta')
      .select('id, nome, posicao, dataNascimento, cpf, fotoUrl, tokenPais, turmaId')
      .eq('escolaId', escolaId).eq('ativo', true).order('nome'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId),
    supabaseAdmin.from('Escola')
      .select('id, nome, cidade, estado, logoUrl, corPrimaria, corSecundaria, corTexto')
      .eq('id', escolaId).single(),
  ])

  const turmasPorId = Object.fromEntries((turmasRes.data ?? []).map(t => [t.id, t.nome]))

  return {
    atletas: atletasRes.data ?? [],
    turmasPorId,
    escola: escolaRes.data,
  }
}
