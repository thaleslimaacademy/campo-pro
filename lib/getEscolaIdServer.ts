import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function getEscolaIdServer(): Promise<string> {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('escolaId')
    .eq('clerkUserId', userId)
    .single()

  if (!data?.escolaId) redirect('/onboarding')
  return data.escolaId
}
