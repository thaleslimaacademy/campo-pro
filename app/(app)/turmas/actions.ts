'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getTurmasComContagem() {
  const escolaId = await getEscolaIdServer()
  const [turmasRes, atletasRes] = await Promise.all([
    supabaseAdmin.from('Turma').select('id, nome, modalidade, descricao, diasSemana, horario, ativa').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
    supabaseAdmin.from('Atleta').select('turmaId').eq('escolaId', escolaId).eq('ativo', true),
  ])
  const turmas = turmasRes.data ?? []
  const atletas = atletasRes.data ?? []
  const counts: Record<string, number> = {}
  atletas.forEach((a: { turmaId: string | null }) => { if (a.turmaId) counts[a.turmaId] = (counts[a.turmaId] ?? 0) + 1 })
  return turmas.map((t: { id: string; [key: string]: unknown }) => ({ ...t, totalAtletas: counts[t.id] ?? 0 }))
}

export async function criarTurma(form: { nome: string; modalidade: string; descricao: string; diasSemana: string; horario: string }) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Turma').insert({ escolaId, nome: form.nome, modalidade: form.modalidade, descricao: form.descricao || null, diasSemana: form.diasSemana || null, horario: form.horario || null })
  revalidatePath('/turmas')
}
