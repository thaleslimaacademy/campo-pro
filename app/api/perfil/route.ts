import { clerkClient } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const headersList = await headers()
  const userId = headersList.get('x-clerk-user-id') || ''
  
  console.log('🔍 /api/perfil userId do header:', userId)

  if (!userId) return NextResponse.json({ perfil: null })

  // 1. Busca por clerkUserId
  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('*')
    .eq('clerkUserId', userId)
    .eq('ativo', true)
    .maybeSingle()
  if (data) return NextResponse.json({ perfil: data })

  // 2. Busca por email — SEM exigir clerkUserId null
  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  console.log('🔍 /api/perfil email Clerk:', email)

  if (email) {
    const { data: porEmail } = await supabaseAdmin
      .from('PerfilUsuario')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle()
    if (porEmail) {
      await supabaseAdmin
        .from('PerfilUsuario')
        .update({ clerkUserId: userId })
        .eq('id', porEmail.id)
      return NextResponse.json({ perfil: { ...porEmail, clerkUserId: userId } })
    }
  }

  return NextResponse.json({ perfil: null })
}
