'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getLocais() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('LocalTreino').select('*').eq('escolaId', escolaId).eq('ativo', true).order('nome')
  return { escolaId, locais: data ?? [] }
}

export async function salvarLocal(escolaId: string, payload: Record<string, unknown>, id?: string) {
  if (id) {
    await supabaseAdmin.from('LocalTreino').update(payload).eq('id', id)
  } else {
    await supabaseAdmin.from('LocalTreino').insert({ ...payload, escolaId, ativo: true })
  }
  revalidatePath('/locais')
}

export async function excluirLocal(id: string) {
  await supabaseAdmin.from('LocalTreino').update({ ativo: false }).eq('id', id)
  revalidatePath('/locais')
}
