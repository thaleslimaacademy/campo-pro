'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

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
