'use server'
import { supabaseAdmin } from '@/lib/supabase'

export async function ativarContaProfessor(
  clerkUserId: string,
  professorId: string,
  escolaId: string,
  nome: string,
  email: string,
  perfil: string
) {
  const { error } = await supabaseAdmin
    .from('PerfilUsuario')
    .upsert({
      clerkUserId,
      escolaId,
      nome,
      email,
      perfil,
      professorId,
      ativo: true,
    }, { onConflict: 'clerkUserId' })
  if (error) return { ok: false, message: error.message }
  await supabaseAdmin
    .from('Professor')
    .update({ contaCriada: true, clerkUserId })
    .eq('id', professorId)
  return { ok: true }
}
