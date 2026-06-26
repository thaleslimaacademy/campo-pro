'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getConvocacoesIniciais() {
  const escolaId = await getEscolaIdServer()
  const [convRes, atsRes, tmsRes] = await Promise.all([
    supabaseAdmin.from('Convocacao').select('*').eq('escolaId', escolaId).order('data', { ascending: false }),
    supabaseAdmin.from('Atleta').select('id, nome, fotoUrl, turmaId, dataNascimento').eq('escolaId', escolaId).eq('ativo', true).order('nome'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
  ])
  return { escolaId, convocacoes: convRes.data ?? [], atletas: atsRes.data ?? [], turmas: tmsRes.data ?? [] }
}

export async function criarConvocacao(escolaId: string, form: Record<string, string>, atletasIds: string[]) {
  const { data: conv } = await supabaseAdmin.from('Convocacao').insert({ escolaId, ...form, status: 'aberta' }).select().single()
  if (conv) await supabaseAdmin.from('ConvocacaoAtleta').insert(atletasIds.map(atletaId => ({ convocacaoId: conv.id, atletaId, status: 'pendente' })))
  revalidatePath('/convocacao')
}

export async function encerrarConvocacao(id: string) {
  await supabaseAdmin.from('Convocacao').update({ status: 'encerrada' }).eq('id', id)
  revalidatePath('/convocacao')
}

export async function excluirConvocacao(id: string) {
  await supabaseAdmin.from('ConvocacaoAtleta').delete().eq('convocacaoId', id)
  await supabaseAdmin.from('Convocacao').delete().eq('id', id)
  revalidatePath('/convocacao')
}
