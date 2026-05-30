import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ perfil: null })

  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('*')
    .eq('clerkUserId', userId)
    .single()

  return NextResponse.json({ perfil: data })
}
