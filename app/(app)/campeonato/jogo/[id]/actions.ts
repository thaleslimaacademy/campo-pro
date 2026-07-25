'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

async function verificarJogo(jogoId: string) {
  const escolaId = await getEscolaIdServer()
  const { data: jogo } = await supabaseAdmin.from('CampeonatoJogo').select('id, campeonatoId, timeAId, timeBId, golsA, golsB').eq('id', jogoId).single()
  if (!jogo) throw new Error('Jogo não encontrado.')
  const { data: camp } = await supabaseAdmin.from('Campeonato').select('id').eq('id', jogo.campeonatoId).eq('escolaId', escolaId).single()
  if (!camp) throw new Error('Jogo não encontrado.')
  return jogo
}

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
  await verificarJogo(id)
  await supabaseAdmin.from('CampeonatoJogo').update({ status }).eq('id', id)
  revalidatePath(`/campeonato/jogo/${id}`)
}

export async function adicionarEventoSumula(jogoId: string, form: { tipo: string; timeId: string; atletaNome: string; minuto: number | null }) {
  const jogo = await verificarJogo(jogoId)
  if (!form.atletaNome || !form.timeId) throw new Error('Selecione o time e informe o atleta.')
  const { error: errEv } = await supabaseAdmin.from('SumulaEvento').insert({
    jogoId, tipo: form.tipo, atletaNome: form.atletaNome, timeId: form.timeId, minuto: form.minuto,
  })
  if (errEv) throw new Error(errEv.message)
  if (form.tipo === 'gol') {
    const novoGolsA = jogo.golsA + (form.timeId === jogo.timeAId ? 1 : 0)
    const novoGolsB = jogo.golsB + (form.timeId === jogo.timeBId ? 1 : 0)
    await supabaseAdmin.from('CampeonatoJogo').update({ golsA: novoGolsA, golsB: novoGolsB }).eq('id', jogoId)
  }
  revalidatePath(`/campeonato/jogo/${jogoId}`)
}

export async function removerEventoSumula(eventoId: string, jogoId: string) {
  const jogo = await verificarJogo(jogoId)
  const { data: evento } = await supabaseAdmin.from('SumulaEvento').select('tipo, timeId').eq('id', eventoId).single()
  if (evento?.tipo === 'gol') {
    const novoGolsA = jogo.golsA - (evento.timeId === jogo.timeAId ? 1 : 0)
    const novoGolsB = jogo.golsB - (evento.timeId === jogo.timeBId ? 1 : 0)
    await supabaseAdmin.from('CampeonatoJogo').update({ golsA: Math.max(0, novoGolsA), golsB: Math.max(0, novoGolsB) }).eq('id', jogoId)
  }
  await supabaseAdmin.from('SumulaEvento').delete().eq('id', eventoId)
  revalidatePath(`/campeonato/jogo/${jogoId}`)
}

export async function salvarRelatorioJogo(jogoId: string, relatorio: string) {
  await verificarJogo(jogoId)
  const { error } = await supabaseAdmin.from('CampeonatoJogo').update({ relatorioArbitro: relatorio }).eq('id', jogoId)
  if (error) throw new Error(error.message)
  revalidatePath(`/campeonato/jogo/${jogoId}`)
}
