import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ perfil: null })

  // 1. Busca por clerkUserId (usuário já vinculado)
  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('*')
    .eq('clerkUserId', userId)
    .eq('ativo', true)
    .maybeSingle()

  if (data) return NextResponse.json({ perfil: data })

  // 2. Busca por email (pré-cadastrado pelo admin, ainda não vinculado)
  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()

  if (email) {
    const { data: porEmail } = await supabaseAdmin
      .from('PerfilUsuario')
      .select('*')
      .eq('email', email)
      .is('clerkUserId', null)
      .eq('ativo', true)
      .maybeSingle()

    if (porEmail) {
      // Vincula o clerkUserId automaticamente no primeiro acesso
      await supabaseAdmin
        .from('PerfilUsuario')
        .update({ clerkUserId: userId })
        .eq('id', porEmail.id)

      return NextResponse.json({ perfil: { ...porEmail, clerkUserId: userId } })
    }
  }

  // 3. Sem perfil → sem acesso
  return NextResponse.json({ perfil: null })
}
