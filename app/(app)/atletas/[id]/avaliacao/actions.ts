'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getAvaliacaoData(atletaId: string) {
  const escolaId = await getEscolaIdServer()
  const [atletaRes, avaliacoesRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('nome, posicao').eq('id', atletaId).single(),
    supabaseAdmin.from('Avaliacao').select('*').eq('atletaId', atletaId).order('dataAvaliacao', { ascending: false }).limit(6),
  ])
  return { escolaId, atleta: atletaRes.data, avaliacoes: avaliacoesRes.data ?? [] }
}

export async function salvarAvaliacao(payload: Record<string, unknown>) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Avaliacao').insert({ ...payload, escolaId })
  revalidatePath(`/atletas/${payload.atletaId}/avaliacao`)
}

export async function recarregarAvaliacoes(atletaId: string) {
  const { data } = await supabaseAdmin.from('Avaliacao').select('*').eq('atletaId', atletaId).order('dataAvaliacao', { ascending: false }).limit(6)
  return data ?? []
}
