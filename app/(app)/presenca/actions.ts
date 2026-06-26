'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function getPresencaData(dataSel: string) {
  const escolaId = await getEscolaIdServer()

  const dataISO = dataSel + 'T00:00:00.000Z'
  const dataFim  = dataSel + 'T23:59:59.999Z'

  // Busca turmas + atletas em paralelo, treino depois (pode precisar criar)
  const [turmasRes, atletasRes] = await Promise.all([
    supabaseAdmin.from('Turma').select('id, nome, modalidade').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
    supabaseAdmin.from('Atleta').select('id, nome, posicao, turmaId').eq('escolaId', escolaId).eq('ativo', true).order('nome'),
  ])

  // Busca ou cria o treino do dia
  let { data: treino } = await supabaseAdmin.from('Treino').select('id').eq('escolaId', escolaId).gte('data', dataISO).lte('data', dataFim).limit(1).maybeSingle()
  if (!treino) {
    const { data: novo } = await supabaseAdmin.from('Treino').insert({ id: crypto.randomUUID(), escolaId, data: dataISO }).select('id').single()
    treino = novo
  }

  // Busca presenças do treino
  const presencasRes = treino
    ? await supabaseAdmin.from('Presenca').select('atletaId, status').eq('treinoId', treino.id)
    : { data: [] }

  const presencasMap: Record<string, 'PRESENTE' | 'AUSENTE'> = {}
  presencasRes.data?.forEach((p: { atletaId: string; status: string }) => {
    presencasMap[p.atletaId] = p.status as 'PRESENTE' | 'AUSENTE'
  })

  return {
    escolaId,
    turmas: turmasRes.data ?? [],
    atletas: atletasRes.data ?? [],
    treinoId: treino?.id ?? null,
    presencas: presencasMap,
  }
}

export async function marcarPresenca(treinoId: string, atletaId: string, status: 'PRESENTE' | 'AUSENTE', jaExiste: boolean) {
  if (jaExiste) {
    await supabaseAdmin.from('Presenca').update({ status }).eq('atletaId', atletaId).eq('treinoId', treinoId)
  } else {
    await supabaseAdmin.from('Presenca').insert({ id: crypto.randomUUID(), atletaId, treinoId, status })
  }
}
