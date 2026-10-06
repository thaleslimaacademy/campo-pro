'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'
import { enviarPush, resumoPush } from '@/lib/push'

export async function carregarDadosMensagem() {
  const escolaId = await getEscolaIdServer()
  const [turmasRes, atletasRes] = await Promise.all([
    supabaseAdmin.from('Turma').select('*').eq('escolaId', escolaId).eq('ativa', true).order('nome'),
    supabaseAdmin.from('Atleta').select('id, nome, fotoUrl, turmaId').eq('escolaId', escolaId).eq('ativo', true).order('nome'),
  ])
  return { escolaId, turmas: turmasRes.data ?? [], atletas: atletasRes.data ?? [] }
}

export async function buscarResponsaveisParaEnvio(atletaIds: string[]) {
  const escolaId = await getEscolaIdServer()
  // confere que todos os atletas pertencem a escola de quem esta logado
  const { data: atletasValidos } = await supabaseAdmin.from('Atleta').select('id').eq('escolaId', escolaId).in('id', atletaIds)
  const idsValidos = (atletasValidos ?? []).map(a => a.id)
  const { data } = await supabaseAdmin.from('Responsavel').select('atletaId, whatsapp, telefone').in('atletaId', idsValidos).eq('principal', true)
  return data ?? []
}

export async function registrarMensagem(form: {
  titulo: string | null; conteudo: string; tipo: string;
  turmaId: string | null; atletaIds: string[]; totalEnviados: number;
}) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Mensagem').insert({
    escolaId, titulo: form.titulo, conteudo: form.conteudo, tipo: form.tipo,
    turmaId: form.turmaId, atletaIds: form.atletaIds, totalEnviados: form.totalEnviados,
  })
  if (error) throw new Error(error.message)
  return { ok: true }
}

/**
 * Envia o comunicado como aviso (push) no celular dos pais e registra no historico.
 * Antes o envio era feito pela Z-API direto do navegador (servico ja desligado):
 * as mensagens contavam como "enviadas" mas nao chegavam.
 */
export async function enviarComunicado(form: {
  titulo: string | null; conteudo: string; tipo: string; turmaId: string | null; atletaIds: string[]
}) {
  const sessao = await requireFinanceiro()
  const escolaId = sessao.escolaId
  const conteudo = (form.conteudo || '').trim()
  if (!conteudo) return { ok: false as const, erro: 'Digite o conteúdo da mensagem.' }

  const { data: validos } = await supabaseAdmin.from('Atleta').select('id')
    .eq('escolaId', escolaId).in('id', form.atletaIds.length ? form.atletaIds : ['-'])
  const ids = ((validos ?? []) as { id: string }[]).map(a => a.id)
  if (!ids.length) return { ok: false as const, erro: 'Nenhum atleta válido selecionado.' }

  const r = await enviarPush({
    escolaId, atletaIds: ids,
    title: form.titulo?.trim() || 'Aviso da escolinha',
    body: conteudo.length > 180 ? conteudo.slice(0, 177) + '…' : conteudo,
  })

  await supabaseAdmin.from('Mensagem').insert({
    escolaId, titulo: form.titulo, conteudo, tipo: form.tipo,
    turmaId: form.turmaId, atletaIds: ids, totalEnviados: r.enviados,
  })

  return { ok: true as const, celulares: r.enviados, atletasComAviso: r.familias, atletas: ids.length }
}

export async function resumoAvisos(atletaIds?: string[]) {
  const escolaId = await getEscolaIdServer()
  return resumoPush(escolaId, atletaIds)
}
