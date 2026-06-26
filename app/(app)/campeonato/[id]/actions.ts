'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function getCampeonatoDetalhe(id: string) {
  const [campRes, tmsRes, jgsRes] = await Promise.all([
    supabaseAdmin.from('Campeonato').select('*').eq('id', id).single(),
    supabaseAdmin.from('CampeonatoTime').select('*').eq('campeonatoId', id).order('nome'),
    supabaseAdmin.from('CampeonatoJogo').select('*').eq('campeonatoId', id).order('data'),
  ])
  return { campeonato: campRes.data, times: tmsRes.data ?? [], jogos: jgsRes.data ?? [] }
}

export async function atualizarStatusCampeonato(id: string, status: string) {
  await supabaseAdmin.from('Campeonato').update({ status }).eq('id', id)
  revalidatePath(`/campeonato/${id}`)
}
