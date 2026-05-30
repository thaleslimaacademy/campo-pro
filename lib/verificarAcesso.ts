import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from './supabase-admin'
import { redirect } from 'next/navigation'

export async function verificarAcesso(rotasPermitidas?: string[]) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { data: perfil } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('*')
    .eq('clerkUserId', userId)
    .single()

  if (!perfil) return { perfil: null, isAdmin: true, isProfessor: false }

  if (!perfil.ativo) redirect('/login')

  const isAdmin = perfil.perfil === 'admin'
  const isProfessor = perfil.perfil === 'professor'

  return { perfil, isAdmin, isProfessor }
}