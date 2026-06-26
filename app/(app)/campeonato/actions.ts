'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getCampeonatos() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Campeonato').select('*').eq('escolaId', escolaId).order('createdAt', { ascending: false })
  return { escolaId, campeonatos: data ?? [] }
}

export async function criarCampeonato(escolaId: string, form: { nome: string; formato: string; dataInicio: string; dataFim: string; descricao: string }) {
  await supabaseAdmin.from('Campeonato').insert({ escolaId, nome: form.nome, formato: form.formato, dataInicio: form.dataInicio || null, dataFim: form.dataFim || null, descricao: form.descricao, status: 'rascunho' })
  revalidatePath('/campeonato')
}

export async function excluirCampeonato(id: string) {
  await supabaseAdmin.from('CampeonatoJogo').delete().eq('campeonatoId', id)
  await supabaseAdmin.from('CampeonatoTime').delete().eq('campeonatoId', id)
  await supabaseAdmin.from('Campeonato').delete().eq('id', id)
  revalidatePath('/campeonato')
}
