'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getTurmaDetalhe(id: string) {
  const escolaId = await getEscolaIdServer()

  // turma + todos os atletas em paralelo
  const [turmaRes, todosRes] = await Promise.all([
    supabaseAdmin.from('Turma').select('*').eq('id', id).single(),
    supabaseAdmin.from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
      .eq('escolaId', escolaId).eq('ativo', true).order('nome'),
  ])

  const todos = todosRes.data ?? []
  const idsNaTurma = todos.filter((a: { turmaId: string | null }) => a.turmaId === id).map((a: { id: string }) => a.id)
  const atletasTurma = todos.filter((a: { id: string }) => idsNaTurma.includes(a.id))
  const atletasSemTurma = todos.filter((a: { id: string }) => !idsNaTurma.includes(a.id))

  return { escolaId, turma: turmaRes.data, atletasTurma, atletasSemTurma, idsNaTurma }
}

export async function adicionarAtletaTurma(atletaId: string, turmaId: string) {
  await supabaseAdmin.from('Atleta').update({ turmaId }).eq('id', atletaId)
  revalidatePath(`/turmas/${turmaId}`)
}

export async function removerAtletaTurma(atletaId: string, turmaId: string) {
  await supabaseAdmin.from('Atleta').update({ turmaId: null }).eq('id', atletaId)
  revalidatePath(`/turmas/${turmaId}`)
}

export async function editarTurma(id: string, payload: Record<string, unknown>) {
  await supabaseAdmin.from('Turma').update(payload).eq('id', id)
  revalidatePath(`/turmas/${id}`)
}

export async function arquivarTurma(id: string) {
  await supabaseAdmin.from('Turma').update({ ativa: false }).eq('id', id)
  revalidatePath('/turmas')
}
