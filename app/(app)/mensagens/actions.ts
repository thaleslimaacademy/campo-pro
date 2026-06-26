'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function getMensagens() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Mensagem')
    .select('id, titulo, conteudo, tipo, totalEnviados, criadoEm')
    .eq('escolaId', escolaId)
    .order('criadoEm', { ascending: false })
    .limit(50)
  return data ?? []
}
