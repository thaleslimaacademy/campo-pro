import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ escolaId: null })

  let escolaId: string | null = null

  // Super admin: verifica cookie de override
  if (SUPER_ADMINS.includes(userId)) {
    const cookieStore = await cookies()
    const override = cookieStore.get('escola_override')?.value
    if (override) escolaId = override
  }

  // Se não tem override, busca do perfil
  if (!escolaId) {
    const { data } = await supabaseAdmin
      .from('PerfilUsuario')
      .select('escolaId')
      .eq('clerkUserId', userId)
      .single()
    escolaId = data?.escolaId || null
  }

  return NextResponse.json({ escolaId, isSuperAdmin: SUPER_ADMINS.includes(userId) })
}
