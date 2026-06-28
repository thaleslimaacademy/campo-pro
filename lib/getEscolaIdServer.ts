import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']

export async function getEscolaIdServer(): Promise<string> {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  // Super admin: verifica cookie de override de escola
  if (SUPER_ADMINS.includes(userId)) {
    const cookieStore = await cookies()
    const override = cookieStore.get('escola_override')?.value
    if (override) return override
  }

  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('escolaId')
    .eq('clerkUserId', userId)
    .single()

  if (!data?.escolaId) redirect('/onboarding')
  return data.escolaId
}
