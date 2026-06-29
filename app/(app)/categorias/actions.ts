'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getCategorias() {
  const escolaId = await getEscolaIdServer()
  const [catRes, turmasRes] = await Promise.all([
    supabaseAdmin.from('Categoria').select('*').eq('escolaId', escolaId).eq('ativa', true).order('modalidade').order('idadeMin'),
    supabaseAdmin.from('Turma').select('id, nome, categoriaId').eq('escolaId', escolaId).eq('ativa', true),
  ])
  return { escolaId, categorias: catRes.data ?? [], turmas: turmasRes.data ?? [] }
}

export async function criarCategoria(dados: { nome: string; descricao?: string; idadeMin?: number; idadeMax?: number; modalidade: string; cor: string }) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Categoria').insert({ ...dados, escolaId, ativa: true })
  revalidatePath('/categorias')
}

export async function editarCategoria(id: string, dados: Record<string, unknown>) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Categoria').update(dados).eq('id', id).eq('escolaId', escolaId)
  revalidatePath('/categorias')
}

export async function excluirCategoria(id: string) {
  const escolaId = await getEscolaIdServer()
  // Desvincula turmas e atletas antes
  await Promise.all([
    supabaseAdmin.from('Turma').update({ categoriaId: null }).eq('categoriaId', id),
    supabaseAdmin.from('Atleta').update({ categoriaId: null }).eq('categoriaId', id),
  ])
  await supabaseAdmin.from('Categoria').update({ ativa: false }).eq('id', id).eq('escolaId', escolaId)
  revalidatePath('/categorias')
}

export async function vincularTurmaCategoria(turmaId: string, categoriaId: string | null) {
  await supabaseAdmin.from('Turma').update({ categoriaId }).eq('id', turmaId)
  revalidatePath('/categorias')
  revalidatePath('/turmas')
}

export async function getAtletasSemCategoria() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Atleta').select('id, nome, dataNascimento, turmaId').eq('escolaId', escolaId).eq('ativo', true).is('categoriaId', null).order('nome')
  return data ?? []
}

export async function vincularAtletaCategoria(atletaId: string, categoriaId: string | null) {
  await supabaseAdmin.from('Atleta').update({ categoriaId }).eq('id', atletaId)
  revalidatePath('/categorias')
}
