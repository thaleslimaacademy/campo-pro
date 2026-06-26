'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function getJogoDetalhe(id: string) {
  const { data: j } = await supabaseAdmin.from('CampeonatoJogo').select('*').eq('id', id).single()
  if (!j) return null
  const [tARes, tBRes, atsARes, atsBRes, evsRes] = await Promise.all([
    supabaseAdmin.from('CampeonatoTime').select('id, nome').eq('id', j.timeAId).single(),
    supabaseAdmin.from('CampeonatoTime').select('id, nome').eq('id', j.timeBId).single(),
    supabaseAdmin.from('CampeonatoAtleta').select('id, nome').eq('timeId', j.timeAId),
    supabaseAdmin.from('CampeonatoAtleta').select('id, nome').eq('timeId', j.timeBId),
    supabaseAdmin.from('SumulaEvento').select('*').eq('jogoId', id).order('minuto'),
  ])
  return { jogo: j, timeA: tARes.data, timeB: tBRes.data, atletasA: atsARes.data ?? [], atletasB: atsBRes.data ?? [], eventos: evsRes.data ?? [] }
}

export async function atualizarStatusJogo(id: string, status: string) {
  await supabaseAdmin.from('CampeonatoJogo').update({ status }).eq('id', id)
  revalidatePath(`/campeonato/jogo/${id}`)
}
