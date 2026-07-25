'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

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
