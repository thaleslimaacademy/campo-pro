'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessao } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Observacoes de conduta: a equipe registra; os pais veem na Area dos Pais.
async function sessaoEquipe() {
  const s = await getSessao()
  if (!s || !s.ativo || s.perfil === 'responsavel') throw new Error('Sem permissão.')
  return s
}

export async function adicionarConduta(atletaId: string, texto: string, tipo: 'positiva' | 'atencao') {
  const s = await sessaoEquipe()
  const t = (texto || '').trim()
  if (t.length < 2 || t.length > 300) return { ok: false as const, erro: 'Escreva entre 2 e 300 caracteres.' }
  const { data: at } = await supabaseAdmin.from('Atleta').select('id').eq('id', atletaId).eq('escolaId', s.escolaId).maybeSingle()
  if (!at) return { ok: false as const, erro: 'Atleta não encontrado.' }
  const { data, error } = await supabaseAdmin.from('AtletaConduta')
    .insert({ escolaId: s.escolaId, atletaId, texto: t, tipo: tipo === 'atencao' ? 'atencao' : 'positiva', criadoPor: s.clerkUserId })
    .select('id, texto, tipo, criadoEm').single()
  if (error) return { ok: false as const, erro: error.message }
  revalidatePath(`/atletas/${atletaId}`)
  revalidatePath('/pais/[token]', 'page')
  return { ok: true as const, item: data }
}

export async function removerConduta(id: string, atletaId: string) {
  const s = await sessaoEquipe()
  const { error } = await supabaseAdmin.from('AtletaConduta').delete().eq('id', id).eq('escolaId', s.escolaId)
  if (error) return { ok: false as const, erro: error.message }
  revalidatePath(`/atletas/${atletaId}`)
  return { ok: true as const }
}
