'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getConvocacoesIniciais() {
  const escolaId = await getEscolaIdServer()
  const [convRes, atsRes, tmsRes] = await Promise.all([
    supabaseAdmin.from('Convocacao').select('*').eq('escolaId', escolaId).order('data', { ascending: false }),
    supabaseAdmin.from('Atleta').select('id, nome, fotoUrl, turmaId, dataNascimento, posicao, categoriaId').eq('escolaId', escolaId).eq('ativo', true).order('nome'),
    supabaseAdmin.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
  ])
  const atletas = atsRes.data ?? []
  
  // Busca status de mensalidade de cada atleta (última cobrança)
  const atletaIds = atletas.map((a: {id: string}) => a.id)
  const { data: cobsData } = atletaIds.length > 0
    ? await supabaseAdmin.from('Cobranca')
        .select('atletaId, status, vencimento')
        .in('atletaId', atletaIds)
        .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])
        .order('vencimento', { ascending: false })
    : { data: [] }

  // Para cada atleta, pega o status mais recente
  const statusMap: Record<string, string> = {}
  for (const c of cobsData || []) {
    if (!statusMap[c.atletaId]) statusMap[c.atletaId] = c.status
  }

  const atletasComStatus = atletas.map((a: Record<string, unknown>) => ({
    ...a,
    statusMensalidade: statusMap[a.id as string] || 'SEM_COBRANCA',
  }))

  // Busca convocados para cada convocação
  const convIds = (convRes.data ?? []).map((c: {id: string}) => c.id)
  const { data: convAtletas } = convIds.length > 0
    ? await supabaseAdmin.from('ConvocacaoAtleta').select('convocacaoId, atletaId').in('convocacaoId', convIds)
    : { data: [] }

  return { escolaId, convocacoes: convRes.data ?? [], atletas: atletasComStatus, turmas: tmsRes.data ?? [], convAtletas: convAtletas ?? [] }
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
