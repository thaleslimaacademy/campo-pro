'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { avisarConvocacaoPush, avisarConvocacaoWhatsApp, resumoConvocacao } from '@/lib/convocacaoAviso'

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

export async function criarConvocacao(_escolaIdCliente: string, form: Record<string, string>, atletasIds: string[]) {
  // escola vem da sessao, nunca do navegador
  const escolaId = await getEscolaIdServer()
  const campos = {
    titulo: form.titulo, tipo: form.tipo, data: form.data || null, horario: form.horario || null,
    local: form.local, descricao: form.descricao,
  }
  const { data: validos } = await supabaseAdmin.from('Atleta').select('id').eq('escolaId', escolaId).in('id', atletasIds.length ? atletasIds : ['-'])
  const ids = ((validos ?? []) as { id: string }[]).map(a => a.id)
  const { data: conv, error } = await supabaseAdmin.from('Convocacao').insert({ escolaId, ...campos, status: 'aberta' }).select('id').single()
  if (error || !conv) throw new Error('Erro ao criar convocação: ' + (error?.message || ''))
  if (ids.length) await supabaseAdmin.from('ConvocacaoAtleta').insert(ids.map(atletaId => ({ convocacaoId: conv.id, atletaId, status: 'pendente' })))
  // aviso gratis no celular dos pais, em segundo plano
  after(() => avisarConvocacaoPush(conv.id, escolaId).catch(e => console.error('push convocacao:', (e as Error).message)))
  revalidatePath('/convocacao')
  return { id: conv.id as string }
}

export async function resumoAvisoConvocacao(convocacaoId: string) {
  const escolaId = await getEscolaIdServer()
  return resumoConvocacao(convocacaoId, escolaId)
}

/** canal 'push' = gratis; 'whatsapp' = so para quem nao tem avisos (pago). */
export async function reenviarAvisoConvocacao(convocacaoId: string, canal: 'push' | 'whatsapp') {
  const escolaId = await getEscolaIdServer()
  return canal === 'push' ? avisarConvocacaoPush(convocacaoId, escolaId) : avisarConvocacaoWhatsApp(convocacaoId, escolaId)
}

export async function encerrarConvocacao(id: string) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Convocacao').update({ status: 'encerrada' }).eq('id', id).eq('escolaId', escolaId)
  revalidatePath('/convocacao')
}

export async function excluirConvocacao(id: string) {
  const escolaId = await getEscolaIdServer()
  const { data: dona } = await supabaseAdmin.from('Convocacao').select('id').eq('id', id).eq('escolaId', escolaId).maybeSingle()
  if (!dona) return
  await supabaseAdmin.from('ConvocacaoAtleta').delete().eq('convocacaoId', id)
  await supabaseAdmin.from('Convocacao').delete().eq('id', id)
  revalidatePath('/convocacao')
}
