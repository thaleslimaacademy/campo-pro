'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function listarAtletasParaPremio() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Atleta').select('id, nome, fotoUrl, posicao, tokenPais')
    .eq('escolaId', escolaId).eq('ativo', true).order('nome')
  return data ?? []
}

export async function listarPremiacoes(atletaId: string) {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Premiacao').select('*')
    .eq('atletaId', atletaId).eq('escolaId', escolaId)
    .order('dataConquista', { ascending: false })
  return data ?? []
}

export async function concederPremio(atletaId: string, titulo: string, icone: string, descricao: string) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Premiacao').insert({
    escolaId, atletaId, titulo, icone, descricao,
    dataConquista: new Date().toISOString().split('T')[0],
  })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function removerPremio(id: string) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Premiacao').delete()
    .eq('id', id).eq('escolaId', escolaId)
  if (error) throw new Error(error.message)
  return { ok: true }
}
