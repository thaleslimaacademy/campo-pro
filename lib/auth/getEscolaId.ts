import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function getEscolaId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Usuário não autenticado')

  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('escolaId')
    .eq('clerkUserId', userId)
    .single()

  if (!data?.escolaId) throw new Error('escolaId não encontrado')
  return data.escolaId
}
