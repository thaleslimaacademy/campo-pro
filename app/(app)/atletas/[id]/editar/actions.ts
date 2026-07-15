'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

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

export async function toggleAtivoAtleta(id: string, ativo: boolean) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Atleta').update({ ativo }).eq('id', id).eq('escolaId', escolaId)
  revalidatePath(`/atletas/${id}`)
}

export async function excluirAtleta(id: string) {
  const escolaId = await getEscolaIdServer()
  await Promise.all([
    supabaseAdmin.from('Presenca').delete().eq('atletaId', id),
    supabaseAdmin.from('Cobranca').delete().eq('atletaId', id),
    supabaseAdmin.from('Responsavel').delete().eq('atletaId', id),
    supabaseAdmin.from('Avaliacao').delete().eq('atletaId', id),
  ])
  await supabaseAdmin.from('Atleta').delete().eq('id', id).eq('escolaId', escolaId)
  revalidatePath('/atletas')
}
