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

export async function adicionarTimeCampeonato(campeonatoId: string, form: { nome: string; tipo: string; responsavelNome: string; responsavelWhatsapp: string }) {
  if (!form.nome) throw new Error('Nome obrigatório.')
  const { count } = await supabaseAdmin.from('CampeonatoTime').select('id', { count: 'exact', head: true }).eq('campeonatoId', campeonatoId)
  if ((count ?? 0) >= 16) throw new Error('Máximo 16 times.')
  const { error } = await supabaseAdmin.from('CampeonatoTime').insert({
    campeonatoId, nome: form.nome, tipo: form.tipo,
    responsavelNome: form.responsavelNome || null,
    responsavelWhatsapp: form.responsavelWhatsapp || null,
    acessoAtivo: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/campeonato/${campeonatoId}`)
}

export async function excluirTimeCampeonato(timeId: string, campeonatoId: string) {
  const { data: jogosA } = await supabaseAdmin.from('CampeonatoJogo').select('id').eq('campeonatoId', campeonatoId).eq('timeAId', timeId)
  const { data: jogosB } = await supabaseAdmin.from('CampeonatoJogo').select('id').eq('campeonatoId', campeonatoId).eq('timeBId', timeId)
  const jogoIds = [...(jogosA ?? []), ...(jogosB ?? [])].map(j => j.id)
  if (jogoIds.length) {
    await supabaseAdmin.from('SumulaEvento').delete().in('jogoId', jogoIds)
    await supabaseAdmin.from('CampeonatoJogo').delete().in('id', jogoIds)
  }
  await supabaseAdmin.from('CampeonatoAtleta').delete().eq('timeId', timeId)
  const { error } = await supabaseAdmin.from('CampeonatoTime').delete().eq('id', timeId)
  if (error) throw new Error(error.message)
  revalidatePath(`/campeonato/${campeonatoId}`)
}

export async function toggleAcessoTime(timeId: string, ativo: boolean, campeonatoId: string) {
  const { error } = await supabaseAdmin.from('CampeonatoTime').update({ acessoAtivo: !ativo }).eq('id', timeId)
  if (error) throw new Error(error.message)
  revalidatePath(`/campeonato/${campeonatoId}`)
}

export async function sortearGruposCampeonato(campeonatoId: string) {
  const { data: times } = await supabaseAdmin.from('CampeonatoTime').select('id').eq('campeonatoId', campeonatoId)
  if (!times || times.length < 2) throw new Error('Adicione pelo menos 2 times.')
  const letras = ['A', 'B', 'C', 'D']
  const embaralhados = [...times].sort(() => Math.random() - 0.5)
  const porGrupo = Math.ceil(embaralhados.length / 4)
  for (let i = 0; i < embaralhados.length; i++) {
    const grupo = letras[Math.floor(i / porGrupo)] || 'A'
    await supabaseAdmin.from('CampeonatoTime').update({ grupo }).eq('id', embaralhados[i].id)
  }
  revalidatePath(`/campeonato/${campeonatoId}`)
}

export async function gerarJogosFaseGruposCampeonato(campeonatoId: string, regerar: boolean) {
  const { data: jogosGrupos } = await supabaseAdmin.from('CampeonatoJogo').select('id').eq('campeonatoId', campeonatoId).eq('fase', 'Fase de Grupos')
  if (jogosGrupos?.length) {
    if (!regerar) return { jaExiste: true, criados: 0 }
    await supabaseAdmin.from('CampeonatoJogo').delete().in('id', jogosGrupos.map(j => j.id))
  }
  const { data: times } = await supabaseAdmin.from('CampeonatoTime').select('id, grupo').eq('campeonatoId', campeonatoId)
  const grupos = [...new Set((times ?? []).map(t => t.grupo).filter(Boolean))]
  if (grupos.length === 0) throw new Error('Sorteie os grupos primeiro.')
  const novos: Record<string, unknown>[] = []
  for (const grupo of grupos) {
    const tg = (times ?? []).filter(t => t.grupo === grupo)
    for (let i = 0; i < tg.length; i++) {
      for (let j = i + 1; j < tg.length; j++) {
        novos.push({ campeonatoId, timeAId: tg[i].id, timeBId: tg[j].id, fase: 'Fase de Grupos', grupo, status: 'agendado', golsA: 0, golsB: 0 })
      }
    }
  }
  if (novos.length === 0) throw new Error('Nenhum jogo gerado.')
  await supabaseAdmin.from('CampeonatoJogo').insert(novos)
  revalidatePath(`/campeonato/${campeonatoId}`)
  return { criados: novos.length, jaExiste: false }
}

export async function gerarJogosFaseCampeonato(
  campeonatoId: string,
  fase: string,
  pares: { timeAId: string; timeBId: string }[],
  regerarFaseExistente: boolean
) {
  const { data: existentes } = await supabaseAdmin.from('CampeonatoJogo').select('id').eq('campeonatoId', campeonatoId).eq('fase', fase)
  if (existentes?.length) {
    if (!regerarFaseExistente) return { jaExiste: true, criados: 0 }
    await supabaseAdmin.from('CampeonatoJogo').delete().in('id', existentes.map(j => j.id))
  }
  const novos = pares.map(p => ({ campeonatoId, timeAId: p.timeAId, timeBId: p.timeBId, fase, status: 'agendado', golsA: 0, golsB: 0 }))
  if (novos.length === 0) return { jaExiste: false, criados: 0 }
  await supabaseAdmin.from('CampeonatoJogo').insert(novos)
  revalidatePath(`/campeonato/${campeonatoId}`)
  return { jaExiste: false, criados: novos.length }
}
