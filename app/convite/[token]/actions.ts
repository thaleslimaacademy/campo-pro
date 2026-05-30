'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function ativarContaProfessor(
  clerkUserId: string,
  professorId: string,
  escolaId: string,
  nome: string,
  email: string
) {
  const { error } = await supabaseAdmin
    .from('PerfilUsuario')
    .upsert({
      clerkUserId,
      escolaId,
      nome,
      email,
      perfil: 'professor',
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